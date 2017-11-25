import Docker from 'dockerode';
import getStream from 'get-stream';
import got from 'got';
import pRetry from 'p-retry';

const SERVER_PORT = 15986;
const COUCHDB_PORT = 5984;
const SERVER_HOST = 'localhost';
const NPM_USERNAME = 'integration';
const NPM_PASSWORD = 'suchsecure';
const NPM_EMAIL = 'integration@test.com';
const docker = new Docker();
let container;

async function checkStatus() {
  const response = await got(`http://${SERVER_HOST}:${SERVER_PORT}/registry/_design/app`, {cache: false});
  if (response.status === 200) {
    // If the registry returns a 200 status, it's ready. Abort the retry.
    throw new pRetry.AbortError();
  }
}

async function start() {
  await getStream(await docker.pull('npmjs/npm-docker-couchdb:1.6.1'));

  container = await docker.createContainer({
    Image: 'npmjs/npm-docker-couchdb:1.6.1',
    PortBindings: {[`${COUCHDB_PORT}/tcp`]: [{HostPort: `${SERVER_PORT}`}]},
  });

  await container.start();

  try {
    // Wait for the registry to be ready
    await pRetry(checkStatus, {retries: 5, minTimeout: 1000, factor: 2});
  } catch (err) {
    throw new Error(`Couldn't start npm-docker-couchdb after 30s`);
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

async function stop() {
  return container.stop();
}

export default {start, stop, authEnv, url};
