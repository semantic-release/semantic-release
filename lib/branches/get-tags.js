const {template, escapeRegExp, flatMap} = require('lodash');
const semver = require('semver');
const pReduce = require('p-reduce');
const debug = require('debug')('semantic-release:get-tags');
const {getTags} = require('../../lib/git');

module.exports = async ({cwd, env, options: {tagFormat}}, branches) => {
  // Generate a regex to parse tags formatted with `tagFormat`
  // by replacing the `version` variable in the template by `(.+)`.
  // The `tagFormat` is compiled with space as the `version` as it's an invalid tag character,
  // so it's guaranteed to no be present in the `tagFormat`.
  const tagRegexp = `^${escapeRegExp(template(tagFormat)({version: ' '})).replace(' ', '(.[^@]+)@?(.+)?')}`;

  return pReduce(
    branches,
    async (branches, branch) => {
      const versions = (await getTags(branch.name, {cwd, env})).reduce((versions, tag) => {
        const [, version, channel] = tag.match(tagRegexp) || [];
        if (version && semver.valid(semver.clean(version))) {
          return {
            ...versions,
            [version]: versions[version]
              ? {...versions[version], channels: [...versions[version].channels, channel]}
              : {gitTag: tag, version, channels: [channel]},
          };
        }

        return versions;
      }, {});

      const branchTags = flatMap(versions);

      debug('found tags for branch %s: %o', branch.name, branchTags);
      return [...branches, {...branch, tags: branchTags}];
    },
    []
  );
};
