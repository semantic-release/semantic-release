var srNormalize = require('semantic-release/dist/lib/plugins').normalize;

var noop = srNormalize({}, "semantic-release/dist/lib/plugin-noop");
var analyzeCommits = require('../../../src/plugins/analyzer.js').default;

module.exports = {
  plugins: {
    "analyzeCommits": analyzeCommits,
    "getLastRelease": function (_ref, cb) {
      cb(null, {
        version: '0.0.0',
        gitHead: 'FOO'
      });
    },
    "verifyRelease": noop
  },
  pre: function (config, cb) {
    cb(null, {type: 'patch', version: '0.0.1'})
  }
};
