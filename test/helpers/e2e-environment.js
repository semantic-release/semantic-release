import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GenericContainer, Wait } from "testcontainers";
import got from "got";
import pRetry from "p-retry";
import yaml from "js-yaml";
import { mockServerClient } from "mockserver-client";
import { gitShallowClone, initBareRepo } from "./git-utils.js";

const helpersDir = dirname(fileURLToPath(import.meta.url));
const composeConfig = yaml.load(readFileSync(join(helpersDir, "e2e.compose.yml"), "utf8"));

const GITBOX_IMAGE = composeConfig.services.gitbox.image;
const NPM_REGISTRY_IMAGE = composeConfig.services["npm-registry"].image;
const MOCK_SERVER_IMAGE = composeConfig.services.mockserver.image;

const GIT_USERNAME = "integration";
const GIT_PASSWORD = "suchsecure";

const NPM_USERNAME = "integration";
const NPM_PASSWORD = "suchsecure";
const NPM_EMAIL = "integration@test.com";

function getServicePort(serviceName) {
  const [port] = composeConfig.services[serviceName].ports;

  if (typeof port === "number") {
    return port;
  }

  if (typeof port === "string") {
    return Number(port.split(":").pop().split("/")[0]);
  }

  if (typeof port === "object" && port?.target) {
    return Number(port.target);
  }

  throw new Error(`Unable to determine port for service "${serviceName}"`);
}

const GITBOX_PORT = getServicePort("gitbox");
const NPM_REGISTRY_PORT = getServicePort("npm-registry");
const MOCK_SERVER_PORT = getServicePort("mockserver");

let gitboxContainer;
let npmRegistryContainer;
let mockServerContainer;
let npmToken;
let mockServerClientInstance;

function requireContainer(container, name) {
  if (!container) {
    throw new Error(`E2E ${name} container is not started`);
  }

  return container;
}

function serviceUrl(container, port, trailingSlash = false) {
  return `http://${container.getHost()}:${container.getMappedPort(port)}${trailingSlash ? "/" : ""}`;
}

export const gitbox = {
  get gitCredential() {
    return `${GIT_USERNAME}:${GIT_PASSWORD}`;
  },
  get repositoryBaseUrl() {
    return serviceUrl(requireContainer(gitboxContainer, "gitbox"), GITBOX_PORT);
  },
  repositoryUrlFor(name) {
    return `${this.repositoryBaseUrl}/git/${name}.git`;
  },
  authUrlFor(name) {
    return `http://${this.gitCredential}@${new URL(this.repositoryBaseUrl).host}/git/${name}.git`;
  },
  async createRepo(name, branch = "master", description = `Repository ${name}`) {
    await requireContainer(gitboxContainer, "gitbox").exec(["repo-admin", "-n", name, "-d", description]);

    const repositoryUrl = this.repositoryUrlFor(name);
    const authUrl = this.authUrlFor(name);

    await pRetry(() => initBareRepo(authUrl, branch), { retries: 5, minTimeout: 500, factor: 2 });
    const cwd = await gitShallowClone(authUrl);

    return { cwd, repositoryUrl, authUrl };
  },
};

export const npmRegistry = {
  get url() {
    return serviceUrl(requireContainer(npmRegistryContainer, "npm-registry"), NPM_REGISTRY_PORT, true);
  },
  authEnv() {
    return {
      npm_config_registry: this.url,
      NPM_TOKEN: npmToken,
    };
  },
};

export const mockServer = {
  get url() {
    return serviceUrl(requireContainer(mockServerContainer, "mockserver"), MOCK_SERVER_PORT);
  },
  async mock(
    path,
    { body: requestBody, headers: requestHeaders },
    { method = "POST", statusCode = 200, body: responseBody }
  ) {
    await mockServerClientInstance.mockAnyResponse({
      httpRequest: { path, method },
      httpResponse: {
        statusCode,
        headers: [{ name: "Content-Type", values: ["application/json; charset=utf-8"] }],
        body: JSON.stringify(responseBody),
      },
      times: { remainingTimes: 1, unlimited: false },
    });

    return {
      method,
      path,
      headers: requestHeaders,
      body: requestBody
        ? { type: "JSON", json: JSON.stringify(requestBody), matchType: "ONLY_MATCHING_FIELDS" }
        : undefined,
    };
  },
  verify(expectation) {
    return mockServerClientInstance.verify(expectation);
  },
};

export async function startE2EEnvironment() {
  const gitbox = new GenericContainer(GITBOX_IMAGE);
  gitbox.createOpts.Tty = true;
  gitbox.createOpts.OpenStdin = true;
  gitboxContainer = await gitbox.withExposedPorts(GITBOX_PORT).withWaitStrategy(Wait.forListeningPorts()).start();

  await gitboxContainer.exec(["ng-auth", "-u", GIT_USERNAME, "-p", GIT_PASSWORD]);

  npmRegistryContainer = await new GenericContainer(NPM_REGISTRY_IMAGE)
    .withExposedPorts(NPM_REGISTRY_PORT)
    .withCopyFilesToContainer([{ source: join(helpersDir, "config.yaml"), target: "/verdaccio/conf/config.yaml" }])
    .withWaitStrategy(Wait.forHttp("/", NPM_REGISTRY_PORT).forStatusCode(200))
    .start();

  mockServerContainer = await new GenericContainer(MOCK_SERVER_IMAGE)
    .withExposedPorts(MOCK_SERVER_PORT)
    .withWaitStrategy(Wait.forHttp("/status", MOCK_SERVER_PORT).withMethod("PUT").forStatusCode(200))
    .start();

  mockServerClientInstance = mockServerClient(
    mockServerContainer.getHost(),
    mockServerContainer.getMappedPort(MOCK_SERVER_PORT)
  );

  await got(`${npmRegistry.url}-/user/org.couchdb.user:${NPM_USERNAME}`, {
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

  ({ token: npmToken } = await got(`${npmRegistry.url}-/npm/v1/tokens`, {
    username: NPM_USERNAME,
    password: NPM_PASSWORD,
    method: "POST",
    headers: { "content-type": "application/json" },
    json: { password: NPM_PASSWORD, readonly: false, cidr_whitelist: [] },
  }).json());
}

export async function stopE2EEnvironment() {
  await Promise.all(
    [mockServerContainer, npmRegistryContainer, gitboxContainer].filter(Boolean).map((container) => container.stop())
  );

  gitboxContainer = undefined;
  npmRegistryContainer = undefined;
  mockServerContainer = undefined;
  npmToken = undefined;
  mockServerClientInstance = undefined;
}
