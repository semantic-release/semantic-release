import execa from 'execa';

export async function npmView(packageName, env) {
  return JSON.parse(await execa.stdout('npm', ['view', packageName, '--json'], {env}));
}
