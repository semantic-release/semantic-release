const Docker = require('dockerode');
const getStream = require('get-stream');
const got = require('got');
const path = require('path');
const delay = require('delay');
const pRetry = require('p-retry');

const IMAGE = 'verdaccio/verdaccio:4';
const REGISTRY_PORT = 4873;
const REGISTRY_HOST = 'localhost';
const NPM_USERNAME = 'integration';
const NPM_PASSWORD = 'suchsecure';
const NPM_EMAIL = 'integration@test.com';
const docker = new Docker();
let container;

/**
 * Download the `npm-registry-docker` Docker image, create a new container and start it.
 */
async function start() {
  await getStream(await docker.pull(IMAGE));

  container = await docker.createContainer({
    Tty: true,
    Image: IMAGE,
    PortBindings: {[`${REGISTRY_PORT}/tcp`]: [{HostPort: `${REGISTRY_PORT}`}]},
    Binds: [`${path.join(__dirname, 'config.yaml')}:/verdaccio/conf/config.yaml`],
  });

  await container.start();
  await delay(4000);

  try {
    // Wait for the registry to be ready
    await pRetry(() => got(`http://${REGISTRY_HOST}:${REGISTRY_PORT}/`, {cache: false}), {
      retries: 7,
      minTimeout: 1000,
      factor: 2,
    });
  } catch {
    throw new Error(`Couldn't start npm-registry-docker after 2 min`);
  }

  // Create user
  await got(`http://${REGISTRY_HOST}:${REGISTRY_PORT}/-/user/org.couchdb.user:${NPM_USERNAME}`, {
    method: 'PUT',
    json: {
      _id: `org.couchdb.user:${NPM_USERNAME}`,
      name: NPM_USERNAME,
      roles: [],
      type: 'user',
      password: NPM_PASSWORD,
      email: NPM_EMAIL,
    },
  });
}

const url = `http://${REGISTRY_HOST}:${REGISTRY_PORT}/`;

const authEnv = {
  npm_config_registry: url, // eslint-disable-line camelcase
  NPM_USERNAME,
  NPM_PASSWORD,
  NPM_EMAIL,
};

/**
 * Stop and remote the `npm-registry-docker` Docker container.
 */
async function stop() {
  await container.stop();
  await container.remove();
}

module.exports = {start, stop, authEnv, url};
