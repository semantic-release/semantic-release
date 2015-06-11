import { parseRawCommit } from 'conventional-changelog/lib/git'

export default function (commits) {
  let type = null

  commits

  .map((commit) => parseRawCommit(`${commit.hash}\n${commit.message}`))

  .filter((commit) => !!commit)

  .every((commit) => {
    if (commit.breaks.length) {
      type = 'major'
      return false
    }

    if (commit.type === 'feat') type = 'minor'

    if (!type && commit.type === 'fix') type = 'patch'

    return true
  })

  return type
}
