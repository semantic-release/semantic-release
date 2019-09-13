import execa from 'execa';

export async function npmView(packageName, env) {
  return JSON.parse((await execa('npm', ['view', packageName, '--json'], {env})).stdout);
}
