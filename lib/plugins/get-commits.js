const getCommits = require('../get-commits');

module.exports = {
  getCommits: async (pluginConfig, {lastRelease, options: {branch}, logger}) => {
    return getCommits(lastRelease, branch, logger);
  },
};
