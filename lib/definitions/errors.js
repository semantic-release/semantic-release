import { inspect } from "node:util";
import { isString, toLower, trim } from "lodash-es";
import { RELEASE_TYPE } from "./constants.js";

import pkg from "../../package.json" with { type: "json" };

const DOCS_URL = "https://semantic-release.org";

const stringify = (object) =>
  isString(object) ? object : inspect(object, { breakLength: Infinity, depth: 2, maxArrayLength: 5 });

const linkify = (file) => {
  const [path, hash] = file.split("#");

  return `${DOCS_URL}/${path.replace(/\.md$/u, "")}${hash ? `#${hash}` : ""}`;
};

const wordsList = (words) =>
  `${words.slice(0, -1).join(", ")}${words.length > 1 ? ` or ${words[words.length - 1]}` : trim(words[0])}`;

export function ENOGITREPO({ cwd }) {
  return {
    message: "Not running from a git repository.",
    details: `The \`semantic-release\` command must be executed from a Git repository.

The current working directory is \`${cwd}\`.

Please verify your CI configuration to make sure the \`semantic-release\` command is executed from the root of the cloned repository.`,
  };
}

export function ENOREPOURL() {
  return {
    message: "The `repositoryUrl` option is required.",
    details: `The [repositoryUrl option](${linkify(
      "usage/configuration#repositoryurl"
    )}) cannot be determined from the semantic-release configuration, the \`package.json\` nor the [git origin url](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes).

Please make sure to add the \`repositoryUrl\` to the [semantic-release configuration](${linkify(
      "usage/configuration#repositoryurl"
    )}).`,
  };
}

export function EINVALIDREPOURL({ repositoryUrl }) {
  return {
    message: "The `repositoryUrl` option is not a valid git URL.",
    details: `The [repositoryUrl option](${linkify(
      "usage/configuration#repositoryurl"
    )}) must be a valid git URL and cannot begin with \`-\`, as \`git\` would otherwise interpret it as a command-line option rather than a URL.

The invalid \`repositoryUrl\` is \`${repositoryUrl}\`.

Please verify the \`repository\` property in your \`package.json\` and the [repositoryUrl option](${linkify(
      "usage/configuration#repositoryurl"
    )}) in your [semantic-release configuration](${linkify("usage/configuration#configuration")}).`,
  };
}

export function EGITNOPERMISSION({ options: { repositoryUrl }, branch: { name } }) {
  return {
    message: "Cannot push to the Git repository.",
    details: `**semantic-release** cannot push the version tag to the branch \`${name}\` on the remote Git repository with URL \`${repositoryUrl}\`.

This can be caused by:
 - a misconfiguration of the [repositoryUrl](${linkify("usage/configuration#repositoryurl")}) option
 - the repository being unavailable
 - or missing push permission for the user configured via the [Git credentials on your CI environment](${linkify(
   "usage/ci-configuration#authentication"
 )})`,
  };
}

export function EINVALIDTAGFORMAT({ options: { tagFormat } }) {
  return {
    message: "Invalid `tagFormat` option.",
    details: `The [tagFormat](${linkify(
      "usage/configuration#tagformat"
    )}) must compile to a [valid Git reference](https://git-scm.com/docs/git-check-ref-format#_description).

Your configuration for the \`tagFormat\` option is \`${stringify(tagFormat)}\`.`,
  };
}

export function ETAGNOVERSION({ options: { tagFormat } }) {
  return {
    message: "Invalid `tagFormat` option.",
    details: `The [tagFormat](${linkify(
      "usage/configuration#tagformat"
    )}) option must contain the variable \`version\` exactly once.

Your configuration for the \`tagFormat\` option is \`${stringify(tagFormat)}\`.`,
  };
}

export function EPLUGINCONF({ type, required, pluginConf }) {
  return {
    message: `The \`${type}\` plugin configuration is invalid.`,
    details: `The [${type} plugin configuration](${linkify(`foundation/plugins#${toLower(type)}-plugin`)}) ${
      required ? "is required and " : ""
    } must be a single or an array of plugins definition. A plugin definition is an npm module name, optionally wrapped in an array with an object.

Your configuration for the \`${type}\` plugin is \`${stringify(pluginConf)}\`.`,
  };
}

export function EPLUGINSCONF({ plugin }) {
  return {
    message: "The `plugins` configuration is invalid.",
    details: `The [plugins](${linkify(
      "usage/configuration#plugins"
    )}) option must be an array of plugin definitions. A plugin definition is an npm module name, optionally wrapped in an array with an object.

The invalid configuration is \`${stringify(plugin)}\`.`,
  };
}

export function EPLUGIN({ pluginName, type }) {
  return {
    message: `A plugin configured in the step ${type} is not a valid semantic-release plugin.`,
    details: `A valid \`${type}\` **semantic-release** plugin must be a function or an object with a function in the property \`${type}\`.

The plugin \`${pluginName}\` doesn't have the property \`${type}\` and cannot be used for the \`${type}\` step.

Please refer to the \`${pluginName}\` and [semantic-release plugins configuration](${linkify(
      "foundation/plugins/#plugin-options-configuration"
    )}) documentation for more details.`,
  };
}

export function EANALYZECOMMITSOUTPUT({ result, pluginName }) {
  return {
    message: "The `analyzeCommits` plugin returned an invalid value. It must return a valid semver release type.",
    details: `The \`analyzeCommits\` plugin must return a valid [semver](https://semver.org) release type. The valid values are: ${RELEASE_TYPE.map(
      (type) => `\`${type}\``
    ).join(", ")}.

The \`analyzeCommits\` function of the \`${pluginName}\` returned \`${stringify(result)}\` instead.

We recommend to report the issue to the \`${pluginName}\` authors, providing the following informations:
- The **semantic-release** version: \`${pkg.version}\`
- The **semantic-release** logs from your CI job
- The value returned by the plugin: \`${stringify(result)}\`
- A link to the **semantic-release** plugin developer guide: [${linkify("developer-guide/plugin")}](${linkify(
      "developer-guide/plugin"
    )})`,
  };
}

export function EGENERATENOTESOUTPUT({ result, pluginName }) {
  return {
    message: "The `generateNotes` plugin returned an invalid value. It must return a `String`.",
    details: `The \`generateNotes\` plugin must return a \`String\`.

The \`generateNotes\` function of the \`${pluginName}\` returned \`${stringify(result)}\` instead.

We recommend to report the issue to the \`${pluginName}\` authors, providing the following informations:
- The **semantic-release** version: \`${pkg.version}\`
- The **semantic-release** logs from your CI job
- The value returned by the plugin: \`${stringify(result)}\`
- A link to the **semantic-release** plugin developer guide: [${linkify("developer-guide/plugin")}](${linkify(
      "developer-guide/plugin"
    )})`,
  };
}

export function EPUBLISHOUTPUT({ result, pluginName }) {
  return {
    message: "A `publish` plugin returned an invalid value. It must return an `Object`.",
    details: `The \`publish\` plugins must return an \`Object\`.

The \`publish\` function of the \`${pluginName}\` returned \`${stringify(result)}\` instead.

We recommend to report the issue to the \`${pluginName}\` authors, providing the following informations:
- The **semantic-release** version: \`${pkg.version}\`
- The **semantic-release** logs from your CI job
- The value returned by the plugin: \`${stringify(result)}\`
- A link to the **semantic-release** plugin developer guide: [${linkify("developer-guide/plugin")}](${linkify(
      "developer-guide/plugin"
    )})`,
  };
}

export function EADDCHANNELOUTPUT({ result, pluginName }) {
  return {
    message: "A `addChannel` plugin returned an invalid value. It must return an `Object`.",
    details: `The \`addChannel\` plugins must return an \`Object\`.

The \`addChannel\` function of the \`${pluginName}\` returned \`${stringify(result)}\` instead.

We recommend to report the issue to the \`${pluginName}\` authors, providing the following informations:
- The **semantic-release** version: \`${pkg.version}\`
- The **semantic-release** logs from your CI job
- The value returned by the plugin: \`${stringify(result)}\`
- A link to the **semantic-release** plugin developer guide: [${linkify("developer-guide/plugin")}](${linkify(
      "developer-guide/plugin"
    )})`,
  };
}

export function EINVALIDBRANCH({ branch }) {
  return {
    message: "A branch is invalid in the `branches` configuration.",
    details: `Each branch in the [branches configuration](${linkify(
      "usage/configuration#branches"
    )}) must be either a string, a regexp or an object with a \`name\` property.

Your configuration for the problematic branch is \`${stringify(branch)}\`.`,
  };
}

export function EINVALIDBRANCHNAME({ branch }) {
  return {
    message: "A branch name is invalid in the `branches` configuration.",
    details: `Each branch in the [branches configuration](${linkify(
      "usage/configuration#branches"
    )}) must be a [valid Git reference](https://git-scm.com/docs/git-check-ref-format#_description).

Your configuration for the problematic branch is \`${stringify(branch)}\`.`,
  };
}

export function EDUPLICATEBRANCHES({ duplicates }) {
  return {
    message: "The `branches` configuration has duplicate branches.",
    details: `Each branch in the [branches configuration](${linkify(
      "usage/configuration#branches"
    )}) must havea unique name.

Your configuration contains duplicates for the following branch names: \`${stringify(duplicates)}\`.`,
  };
}

export function EMAINTENANCEBRANCH({ branch }) {
  return {
    message: "A maintenance branch is invalid in the `branches` configuration.",
    details: `Each maintenance branch in the [branches configuration](${linkify(
      "usage/configuration#branches"
    )}) must have a \`range\` property formatted like \`N.x\`, \`N.x.x\` or \`N.N.x\` (\`N\` is a number).

Your configuration for the problematic branch is \`${stringify(branch)}\`.`,
  };
}

export function EMAINTENANCEBRANCHES({ branches }) {
  return {
    message: "The maintenance branches are invalid in the `branches` configuration.",
    details: `Each maintenance branch in the [branches configuration](${linkify(
      "usage/configuration#branches"
    )}) must have a unique \`range\` property and must exist on the remote repository.

Your configuration for the problematic branches is \`${stringify(branches)}\`.`,
  };
}

export function ERELEASEBRANCHES({ branches }) {
  return {
    message: "The release branches are invalid in the `branches` configuration.",
    details: `A minimum of 1 and a maximum of 3 release branches are required in the [branches configuration](${linkify(
      "usage/configuration#branches"
    )}). These branches must exist on the remote repository.

This may occur if your repository does not have a release branch, such as \`master\` or \`main\`.

Your configuration for the problematic branches is \`${stringify(branches)}\`.`,
  };
}

export function EPRERELEASEBRANCH({ branch }) {
  return {
    message: "A pre-release branch configuration is invalid in the `branches` configuration.",
    details: `Each pre-release branch in the [branches configuration](${linkify(
      "usage/configuration#branches"
    )}) must have a \`prerelease\` property valid per the [Semantic Versioning Specification](https://semver.org/#spec-item-9). If the \`prerelease\` property is set to \`true\`, then the \`name\` property is used instead. Additionally, each pre-release branch must exist on the remote repository.

Your configuration for the problematic branch is \`${stringify(branch)}\`.`,
  };
}

export function EPRERELEASEBRANCHES({ branches }) {
  return {
    message: "The pre-release branches are invalid in the `branches` configuration.",
    details: `Each pre-release branch in the [branches configuration](${linkify(
      "usage/configuration#branches"
    )}) must have a unique \`prerelease\` property. If the \`prerelease\` property is set to \`true\`, then the \`name\` property is used instead.

Your configuration for the problematic branches is \`${stringify(branches)}\`.`,
  };
}

export function EINVALIDNEXTVERSION({ nextRelease: { version }, branch: { name, range }, commits, validBranches }) {
  return {
    message: `The release \`${version}\` on branch \`${name}\` cannot be published as it is out of range.`,
    details: `Based on the releases published on other branches, only versions within the range \`${range}\` can be published from branch \`${name}\`.

The following commit${commits.length > 1 ? "s are" : " is"} responsible for the invalid release:
${commits.map(({ commit: { short }, subject }) => `- ${subject} (${short})`).join("\n")}

${
  commits.length > 1 ? "Those commits" : "This commit"
} should be moved to a valid branch with [git merge](https://git-scm.com/docs/git-merge) or [git cherry-pick](https://git-scm.com/docs/git-cherry-pick) and removed from branch \`${name}\` with [git revert](https://git-scm.com/docs/git-revert) or [git reset](https://git-scm.com/docs/git-reset).

A valid branch could be ${wordsList(validBranches.map(({ name }) => `\`${name}\``))}.

See the [workflow configuration documentation](${linkify("foundation/workflow-configuration")}) for more details.`,
  };
}

export function EINVALIDMAINTENANCEMERGE({ nextRelease: { channel, gitTag, version }, branch: { mergeRange, name } }) {
  return {
    message: `The release \`${version}\` on branch \`${name}\` cannot be published as it is out of range.`,
    details: `Only releases within the range \`${mergeRange}\` can be merged into the maintenance branch \`${name}\` and published to the \`${channel}\` distribution channel.

The branch \`${name}\` head should be [reset](https://git-scm.com/docs/git-reset) to a previous commit so the commit with tag \`${gitTag}\` is removed from the branch history.

See the [workflow configuration documentation](${linkify("foundation/workflow-configuration")}) for more details.`,
  };
}
