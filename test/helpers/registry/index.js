import execa from 'execa';

const opts = {cwd: __dirname};

export const uri =
  'http://localhost:' + (process.env.TRAVIS === 'true' ? 5984 : 15986) + '/registry/_design/app/_rewrite/';

export function start() {
  return execa('./start.sh', opts);
}

export function stop() {
  return execa('./stop.sh', opts);
}
