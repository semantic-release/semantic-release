const {template, escapeRegExp} = require('lodash');
const semver = require('semver');
const pReduce = require('p-reduce');
const debug = require('debug')('semantic-release:get-tags');
const {getTags, isRefInHistory, getTagHead} = require('../../lib/git');

module.exports = async ({cwd, env, options: {tagFormat}}, branches) => {
  // Generate a regex to parse tags formatted with `tagFormat`
  // by replacing the `version` variable in the template by `(.+)`.
  // The `tagFormat` is compiled with space as the `version` as it's an invalid tag character,
  // so it's guaranteed to no be present in the `tagFormat`.
  const tagRegexp = `^${escapeRegExp(template(tagFormat)({version: ' '})).replace(' ', '(.[^@]+)@?(.+)?')}`;
  const tags = (await getTags({cwd, env}))
    .map(tag => {
      const [, version, channel] = tag.match(tagRegexp) || [];
      return {gitTag: tag, version, channel};
    })
    .filter(({version}) => version && semver.valid(semver.clean(version)));

  debug('found tags: %o', tags);

  return pReduce(
    branches,
    async (branches, branch) => {
      const branchTags = await pReduce(
        tags,
        async (tags, {gitTag, ...rest}) =>
          (await isRefInHistory(gitTag, branch.name, true, {cwd, env}))
            ? [...tags, {...rest, gitTag, gitHead: await getTagHead(gitTag, {cwd, env})}]
            : tags,
        []
      );

      debug('found tags for branch %s: %o', branch.name, branchTags);
      return [...branches, {...branch, tags: branchTags}];
    },
    []
  );
};
