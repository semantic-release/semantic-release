import execa from 'execa';

const opts = {cwd: __dirname};
const uri = 'http://localhost:' + (process.env.TRAVIS === 'true' ? 5984 : 15986) + '/registry/_design/app/_rewrite/';

function start() {
  return execa('./start.sh', opts);
}

function stop() {
  return execa('./stop.sh', opts);
}

export default {start, stop, uri};
