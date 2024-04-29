import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import Docker from "dockerode";
import got from "got";
import pRetry from "p-retry";

const IMAGE = "verdaccio/verdaccio:5";
const REGISTRY_PORT = 4873;
const REGISTRY_HOST = "localhost";
const NPM_USERNAME = "integration";
const NPM_PASSWORD = "suchsecure";
const NPM_EMAIL = "integration@test.com";
const docker = new Docker();
const __dirname = dirname(fileURLToPath(import.meta.url));
let container, npmToken;

/**
 * Download the `npm-registry-docker` Docker image
 */
export function pull() {
  return docker.pull(IMAGE).then((stream) => {
    return new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
    });
  });
}

/**
 * create a new container and start it.
 */
export async function start() {
  container = await docker.createContainer({
    Tty: true,
    Image: IMAGE,
    HostConfig: {
      PortBindings: { [`${REGISTRY_PORT}/tcp`]: [{ HostPort: `${REGISTRY_PORT}` }] },
      Binds: [`${path.join(__dirname, "config.yaml")}:/verdaccio/conf/config.yaml`],
    },
    ExposedPorts: { [`${REGISTRY_PORT}/tcp`]: {} },
  });

  await container.start();
  await setTimeout(4000);

  try {
    // Wait for the registry to be ready
    await pRetry(() => got(`http://${REGISTRY_HOST}:${REGISTRY_PORT}/`, { cache: false }), {
      retries: 7,
      minTimeout: 1000,
      factor: 2,
    });
  } catch {
    throw new Error(`Couldn't start npm-registry-docker after 2 min`);
  }

  // Create user
  await got(`http://${REGISTRY_HOST}:${REGISTRY_PORT}/-/user/org.couchdb.user:${NPM_USERNAME}`, {
    method: "PUT",
    json: {
      _id: `org.couchdb.user:${NPM_USERNAME}`,
      name: NPM_USERNAME,
      roles: [],
      type: "user",
      password: NPM_PASSWORD,
      email: NPM_EMAIL,
    },
  });

  // Create token for user
  ({ token: npmToken } = await got(`http://${REGISTRY_HOST}:${REGISTRY_PORT}/-/npm/v1/tokens`, {
    username: NPM_USERNAME,
    password: NPM_PASSWORD,
    method: "POST",
    headers: { "content-type": "application/json" },
    json: { password: NPM_PASSWORD, readonly: false, cidr_whitelist: [] },
  }).json());
}

export const url = `http://${REGISTRY_HOST}:${REGISTRY_PORT}/`;

export const authEnv = () => ({
  npm_config_registry: url, // eslint-disable-line camelcase
  NPM_TOKEN: npmToken,
});

/**
 * Stop and remote the `npm-registry-docker` Docker container.
 */
export async function stop() {
  await container.stop();
  await container.remove();
}
