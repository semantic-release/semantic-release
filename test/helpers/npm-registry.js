import Docker from 'dockerode';
import getStream from 'get-stream';
import got from 'got';
import delay from 'delay';
import pRetry from 'p-retry';

const IMAGE = 'npmjs/npm-docker-couchdb:1.6.1';
const SERVER_PORT = 15986;
const COUCHDB_PORT = 5984;
const SERVER_HOST = 'localhost';
const NPM_USERNAME = 'integration';
const NPM_PASSWORD = 'suchsecure';
const NPM_EMAIL = 'integration@test.com';
const docker = new Docker();
let container;

/**
 * Download the `npm-docker-couchdb` Docker image, create a new container and start it.
 */
async function start() {
  await getStream(await docker.pull(IMAGE));

  container = await docker.createContainer({
    Tty: true,
    Image: IMAGE,
    PortBindings: {[`${COUCHDB_PORT}/tcp`]: [{HostPort: `${SERVER_PORT}`}]},
  });

  await container.start();
  await delay(3000);

  try {
    // Wait for the registry to be ready
    await pRetry(() => got(`http://${SERVER_HOST}:${SERVER_PORT}/registry/_design/app`, {cache: false}), {
      retries: 7,
      minTimeout: 1000,
      factor: 2,
    });
  } catch (err) {
    throw new Error(`Couldn't start npm-docker-couchdb after 2 min`);
  }

  // Create user
  await got(`http://${SERVER_HOST}:${SERVER_PORT}/_users/org.couchdb.user:${NPM_USERNAME}`, {
    json: true,
    auth: 'admin:admin',
    method: 'PUT',
    body: {
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
 * Stop and remote the `npm-docker-couchdb` Docker container.
 */
async function stop() {
  await container.stop();
  await container.remove();
}

export default {start, stop, authEnv, url};
