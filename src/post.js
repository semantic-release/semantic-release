import {readFileSync as readFile } from 'fs'
import url from 'url'

import gitHead from 'git-head'
import GitHubApi from 'github'
import parseSlug from 'parse-github-repo-url'

import { efh } from './lib/error'

export default function (options, plugins, cb) {
  const pkg = JSON.parse(readFile('./package.json'))
  const repository = pkg.repository ? pkg.repository.url : null

  if (!repository) return cb(new Error('Package must have a repository'))

  const notesGenerator = require(plugins.notes || './lib/release-notes')

  const config = options['github-url'] ? url.parse(options['github-url']) : {}

  const github = new GitHubApi({
    version: '3.0.0',
    port: config.port,
    protocol: (config.protocol || '').split(':')[0] || null,
    host: config.hostname
  })

  notesGenerator(efh(cb)((log) => {
    gitHead(efh(cb)((hash) => {
      const ghRepo = parseSlug(repository)
      const release = {
        owner: ghRepo[0],
        repo: ghRepo[1],
        tag_name: `v${pkg.version}`,
        target_commitish: hash,
        draft: options.debug,
        body: log
      }

      github.authenticate({
        type: 'oauth',
        token: options.token
      })

      github.releases.createRelease(release, efh(cb)(() => cb(null, true)))
    }))
  }))
}
