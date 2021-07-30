import execa from 'execa';

async function npmView(packageName, env) {
  return JSON.parse((await execa('npm', ['view', packageName, '--json'], {env})).stdout);
}

const exported = {
  npmView,
};

export default exported;
export {npmView};
