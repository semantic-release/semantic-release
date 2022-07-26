const Docker = require('dockerode');
const getStream = require('get-stream');
const pRetry = require('p-retry');
const {initBareRepo, gitShallowClone} = require('./git-utils');

const IMAGE = 'semanticrelease/docker-gitbox:latest';
const SERVER_PORT = 80;
const HOST_PORT = 2080;
const SERVER_HOST = 'localhost';
const GIT_USERNAME = 'integration';
const GIT_PASSWORD = 'suchsecure';
const docker = new Docker();
let container;

const gitCredential = `${GIT_USERNAME}:${GIT_PASSWORD}`;

/**
 * Download the `gitbox` Docker image, create a new container and start it.
 */
async function start() {
  await getStream(await docker.pull(IMAGE));

  container = await docker.createContainer({
    Tty: true,
    Image: IMAGE,
    PortBindings: {[`${SERVER_PORT}/tcp`]: [{HostPort: `${HOST_PORT}`}]},
  });
  await container.start();

  const exec = await container.exec({
    Cmd: ['ng-auth', '-u', GIT_USERNAME, '-p', GIT_PASSWORD],
    AttachStdout: true,
    AttachStderr: true,
  });
  await exec.start();
}

/**
 * Stop and remote the `mockserver` Docker container.
 */
async function stop() {
  await container.stop();
  await container.remove();
}

/**
 * Initialize a remote repository and creates a shallow clone.
 *
 * @param {String} name The remote repository name.
 * @param {String} [branch='master'] The branch to initialize.
 * @param {String} [description=`Repository ${name}`] The repository description.
 * @return {Object} The `repositoryUrl` (URL without auth) and `authUrl` (URL with auth).
 */
async function createRepo(name, branch = 'master', description = `Repository ${name}`) {
  const exec = await container.exec({
    Cmd: ['repo-admin', '-n', name, '-d', description],
    AttachStdout: true,
    AttachStderr: true,
  });
  await exec.start();

  const repositoryUrl = `http://${SERVER_HOST}:${HOST_PORT}/git/${name}.git`;
  const authUrl = `http://${gitCredential}@${SERVER_HOST}:${HOST_PORT}/git/${name}.git`;

  // Retry as the server might take a few ms to make the repo available push
  await pRetry(() => initBareRepo(authUrl, branch), {retries: 5, minTimeout: 500, factor: 2});
  const cwd = await gitShallowClone(authUrl);

  return {cwd, repositoryUrl, authUrl};
}

module.exports = {start, stop, gitCredential, createRepo};
