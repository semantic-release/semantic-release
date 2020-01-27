const Docker = require('dockerode');
const getStream = require('get-stream');
const got = require('got');
const delay = require('delay');
const pRetry = require('p-retry');

const IMAGE = 'semanticrelease/npm-registry-docker:latest';
const SERVER_PORT = 15986;
const COUCHDB_PORT = 5984;
const SERVER_HOST = 'localhost';
const COUCHDB_USER = 'admin';
const COUCHDB_PASSWORD = 'password';
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
    PortBindings: {[`${COUCHDB_PORT}/tcp`]: [{HostPort: `${SERVER_PORT}`}]},
    Env: [`COUCHDB_USER=${COUCHDB_USER}`, `COUCHDB_PASSWORD=${COUCHDB_PASSWORD}`],
  });

  await container.start();
  await delay(4000);

  try {
    // Wait for the registry to be ready
    await pRetry(() => got(`http://${SERVER_HOST}:${SERVER_PORT}/registry/_design/app`, {cache: false}), {
      retries: 7,
      minTimeout: 1000,
      factor: 2,
    });
  } catch (_) {
    throw new Error(`Couldn't start npm-registry-docker after 2 min`);
  }

  // Create user
  await got(`http://${SERVER_HOST}:${SERVER_PORT}/_users/org.couchdb.user:${NPM_USERNAME}`, {
    username: COUCHDB_USER,
    password: COUCHDB_PASSWORD,
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

const url = `http://${SERVER_HOST}:${SERVER_PORT}/registry/_design/app/_rewrite/`;

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
