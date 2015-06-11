import { readFileSync as readFile } from 'fs'

import changelog from 'conventional-changelog'
import parseUrl from 'github-url-from-git'

export default function (cb) {
  const pkg = JSON.parse(readFile('./package.json'))
  const repository = pkg.repository ? parseUrl(pkg.repository.url) : null

  changelog({
    version: pkg.version,
    repository: repository,
    file: false
  }, cb)
}
