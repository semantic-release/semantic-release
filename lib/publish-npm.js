const {appendFile, readJson, writeJson, pathExists} = require('fs-extra');
const execa = require('execa');
const nerfDart = require('nerf-dart');
const debug = require('debug')('semantic-release:publish-npm');
const {debugShell} = require('./debug');
const logger = require('./logger');

module.exports = async (pkg, {conf, registry, auth}, {version}) => {
  const pkgFile = await readJson('./package.json');

  if (await pathExists('./npm-shrinkwrap.json')) {
    const shrinkwrap = await readJson('./npm-shrinkwrap.json');
    shrinkwrap.version = version;
    await writeJson('./npm-shrinkwrap.json', shrinkwrap);
    logger.log('Wrote version %s to npm-shrinkwrap.json', version);
  }

  await writeJson('./package.json', Object.assign(pkgFile, {version}));
  logger.log('Wrote version %s to package.json', version);

  if (process.env.NPM_OLD_TOKEN && process.env.NPM_EMAIL) {
    // Using the old auth token format is not considered part of the public API
    // This might go away anytime (i.e. once we have a better testing strategy)
    await appendFile('./.npmrc', `_auth = \${NPM_OLD_TOKEN}\nemail = \${NPM_EMAIL}`);
    logger.log('Wrote NPM_OLD_TOKEN and NPM_EMAIL to .npmrc.');
  } else {
    await appendFile('./.npmrc', `${nerfDart(registry)}:_authToken = \${NPM_TOKEN}`);
    logger.log('Wrote NPM_TOKEN to .npmrc.');
  }

  logger.log('Publishing version %s to npm registry %s', version, registry);
  const shell = await execa('npm', ['publish']);
  console.log(shell.stdout);
  debugShell('Publishing on npm', shell, debug);
};
