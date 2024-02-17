import semver from "semver";
import { template } from "lodash-es";
import { FIRST_RELEASE, FIRSTPRERELEASE } from "./definitions/constants.js";
import { getLatestVersion, highest, isSameChannel, tagsToVersions } from "./utils.js";

export default ({
  branch,
  envCi: {commit, build},
  nextRelease: {type, channel},
  lastRelease,
  logger,
  prereleaseVersion
}) => {
  const prereleaseVersion = prereleaseVersion !== undefined
    ? template(prereleaseBuildFormat)({build, commit})
    : FIRSTPRERELEASE

  let version;
  if (lastRelease.version) {
    const { major, minor, patch } = semver.parse(lastRelease.version);

    if (branch.type === "prerelease") {
      if (
        semver.prerelease(lastRelease.version) &&
        lastRelease.channels.some((lastReleaseChannel) => isSameChannel(lastReleaseChannel, channel))
      ) {
        const version1 = prereleaseVersion === undefined
          ? semver.inc(lastRelease.version, "prerelease")
          :`${major}.${minor}.${patch}-${branch.prerelease}.${prereleaseVersion}`
        
        version = highest(
          version1,
          `${semver.inc(getLatestVersion(tagsToVersions(branch.tags), { withPrerelease: true }), type)}-${
            branch.prerelease
          }.${prereleaseVersion}`
        );
      } else {
        version = `${semver.inc(`${major}.${minor}.${patch}`, type)}-${branch.prerelease}.${prereleaseVersion}`;
      }
    } else {
      version = semver.inc(lastRelease.version, type);
    }

    logger.log("The next release version is %s", version);
  } else {
    version = branch.type === "prerelease" ? `${FIRST_RELEASE}-${branch.prerelease}.${prereleaseVersion}` : FIRST_RELEASE;
    logger.log(`There is no previous release, the next release version is ${version}`);
  }

  return version;
};
