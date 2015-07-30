const nock = require('nock')

const availableModule = {
  'dist-tags': {
    latest: '1.33.7',
    foo: '0.8.15'
  },
  versions: {
    '0.8.15': {
      gitHead: 'bar'
    },
    '1.33.7': {
      gitHead: 'HEAD'
    }
  }
}

module.exports = nock('http://registry.npmjs.org')
  .get('/available')
  .reply(200, availableModule)
  .get('/tagged')
  .reply(200, availableModule)
  .get('/untagged')
  .reply(200, availableModule)
  .get('/@scoped%2Favailable')
  .reply(200, availableModule)
  .get('/unavailable')
  .reply(404, {})
