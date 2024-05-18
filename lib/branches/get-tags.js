import { escapeRegExp, template } from "lodash-es";
import semver from "semver";
import pReduce from "p-reduce";
import debugTags from "debug";
import { getNote, getTags } from "../../lib/git.js";

const debug = debugTags("semantic-release:get-tags");

export default async ({ cwd, env, options: { tagFormat } }, branches) => {
  // Generate a regex to parse tags formatted with `tagFormat`
  // by replacing the `version` variable in the template by `(.+)`.
  // The `tagFormat` is compiled with space as the `version` as it's an invalid tag character,
  // so it's guaranteed to no be present in the `tagFormat`.
  var temp = template(tagFormat)({ version: " " });
  const prefix = temp.split(" ")[0];
  temp = temp.replace(prefix, "");
  if (temp.indexOf(" +") != -1) {
    // tagFormat contains build metadata.
    temp = temp.split(" +")[0] + " ";
  }

  const tagRegexp = `^${escapeRegExp(temp).replace(" ", "(.+)")}`;
  return pReduce(
    branches,
    async (branches, branch) => {
      const branchTags = await pReduce(
        await getTags(branch.name, { cwd, env }),
        async (branchTags, tag) => {
          if (tag.startsWith(prefix)) {
            // This tag's prefix is valid, continue to analyse
            var [, version] = tag.replace(prefix, "").match(tagRegexp) || [];
            if (version) {
              version = semver.valid(version);
            }
            if (version) {
              return [
                ...branchTags,
                { gitTag: tag, version, channels: (await getNote(tag, { cwd, env })).channels || [null] },
              ];
            }
          }
          return branchTags;
        },
        []
      );

      branchTags.sort((a, b) => {
        if (semver.lt(a.gitTag, b.gitTag)) {
          return -1;
        } else if (semver.gt(a.gitTag, b.gitTag)) {
          return 1;
        }
        return a.gitTag < b.gitTag;
      });
      debug("found tags for branch %s: %o", branch.name, branchTags);
      return [...branches, { ...branch, tags: branchTags }];
    },
    []
  );
};
