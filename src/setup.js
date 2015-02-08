'use strict'

var fs = require('fs')

var ini = require('ini')
var ghUrl = require('github-url-from-git')

module.exports = function () {
  var pkg = JSON.parse(fs.readFileSync('./package.json') + '')

  // ensure a yet unpublished version
  pkg.version = '0.0.0-semantically-released'

  // set up scripts
  var pre = 'semantic-release pre'
  var post = 'semantic-release post'

  if (!pkg.scripts) pkg.scripts = {}

  if (!pkg.scripts.prepublish) pkg.scripts.prepublish = pre
  else if (!(new RegExp(pre).test(pkg.scripts.prepublish))) pkg.scripts.prepublish += ' && ' + pre

  if (!pkg.scripts.postpublish) pkg.scripts.postpublish = post
  else if (!(new RegExp(post).test(pkg.scripts.postpublish))) pkg.scripts.postpublish += ' && ' + post

  // set up repository
  if (!pkg.repository || !pkg.repository.url) {
    var config = ini.decode(fs.readFileSync('./.git/config') + '')
    var repo = config['remote "origin"'].url

    if (repo) pkg.repository = {
      type: 'git',
      url: ghUrl(repo)
    }
  }

  // set up devDependency
  if (!pkg.devDependencies) pkg.devDependencies = {}

  if (!pkg.devDependencies['semantic-release']) {
    pkg.devDependencies['semantic-release'] = '^' + require('../package.json').version
  }

  fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2))
}
