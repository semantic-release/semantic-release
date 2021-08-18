const execa = require('execa');

async function npmView(packageName, env) {
  return JSON.parse((await execa('npm', ['view', packageName, '--json'], {env})).stdout);
}

module.exports = {npmView};
