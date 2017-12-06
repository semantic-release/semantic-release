module.exports = ({pkg: {release = {}}, npm: {tag}}) => {
  // if npm dist tag is 'latest', no need to continue
  if (tag === 'latest') {
    return false;
  }
  // obtain release.no-pre-release config
  const noPreReleaseTags = release['no-pre-release'] || ['latest'];

  // if no-pre-release isn't equal to npm dist tag nor included when an Array,
  // do a 'pre-release'
  if (
    (typeof noPreReleaseTags === 'string' && noPreReleaseTags !== tag) ||
    (Array.isArray(noPreReleaseTags) && !noPreReleaseTags.includes(tag))
  ) {
    return true;
  }

  return false;
};
