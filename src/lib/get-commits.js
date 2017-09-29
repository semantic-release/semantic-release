const execa = require('execa');
const log = require('npmlog');
const SemanticReleaseError = require('@semantic-release/error');

module.exports = async ({lastRelease, options}) => {
  let stdout;
  if (lastRelease.gitHead) {
    try {
      ({stdout} = await execa('git', ['branch', '--no-color', '--contains', lastRelease.gitHead]));
    } catch (err) {
      throw notInHistoryError(lastRelease.gitHead, options.branch);
    }
    const branches = stdout
      .split('\n')
      .map(branch => branch.replace('*', '').trim())
      .filter(branch => !!branch);

    if (!branches.includes(options.branch)) {
      throw notInHistoryError(lastRelease.gitHead, options.branch, branches);
    }
  }

  try {
    ({stdout} = await execa('git', [
      'log',
      '--format=%H==SPLIT==%B==END==',
      `${lastRelease.gitHead ? lastRelease.gitHead + '..' : ''}HEAD`,
    ]));
  } catch (err) {
    return [];
  }

  return String(stdout)
    .split('==END==')
    .filter(raw => !!raw.trim())
    .map(raw => {
      const [hash, message] = raw.trim().split('==SPLIT==');
      return {hash, message};
    });
};

function notInHistoryError(gitHead, branch, branches) {
  log.error(
    'commits',
    `
The commit the last release of this package was derived from is not in the direct history of the "${branch}" branch.
This means semantic-release can not extract the commits between now and then.
This is usually caused by force pushing, releasing from an unrelated branch, or using an already existing package name.
You can recover from this error by publishing manually or restoring the commit "${gitHead}".
${branches && branches.length
      ? `\nHere is a list of branches that still contain the commit in question: \n * ${branches.join('\n * ')}`
      : ''}
`
  );
  return new SemanticReleaseError('Commit not in history', 'ENOTINHISTORY');
}
