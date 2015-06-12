const { readFileSync } = require('fs')

let exports = module.exports = function (input) {
  const options = exports.verifyOptions(input)
  const pkg = exports.verifyPackage()
  const travis = exports.verifyTravis()
  return options && pkg && travis
}

exports.verifyTravis = function () {
  let travis
  try {
    travis = String(readFileSync('.travis.yml'))
  } catch (e) {
    return true
  }

  let passed = true

  if (!/\sdeploy:/m.test(travis)) {
    console.error('You should configure deployments inside the ".travis.yml".')
    passed = false
  }

  if (!/skip_cleanup:/m.test(travis)) {
    console.error('You must set "skip_cleanup" to "true" inside the ".travis.yml".')
    passed = false
  }

  return passed
}

exports.verifyPackage = function () {
  let passed = true

  let pkg
  try {
    pkg = String(readFileSync('./package.json'))
  } catch (e) {
    console.error('You must have a "package.json" present.')
    passed = false
    pkg = '{}'
  }

  try {
    pkg = JSON.parse(pkg)
  } catch (e) {
    console.error('You must have a "package.json" that is valid JSON.')
    return false
  }

  if (!pkg.repository || !pkg.repository.url) {
    console.error('You must define your GitHub "repository" inside the "package.json".')
    passed = false
  }

  if (!pkg.scripts || !pkg.scripts.prepublish || !pkg.scripts.postpublish) {
    console.error('You must define your "scripts" inside the "package.json".')
    passed = false
  }

  return passed
}

exports.verifyOptions = function (options) {
  if (!options) return true
  if (options.token) return true

  console.error('You must define a GitHub token.')
  return false
}
