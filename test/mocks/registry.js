const nock = require('nock')

const availableModule = {
  'dist-tags': {
    latest: '1.33.7'
  },
  versions: {
    '1.33.7': {
      gitHead: 'HEAD'
    }
  }
}

module.exports = nock('http://registry.npmjs.org')
  .get('/available')
  .reply(200, availableModule)
  .get('/@scoped/available')
  .reply(200, availableModule)
  .get('/unavailable')
  .reply(404, {})
