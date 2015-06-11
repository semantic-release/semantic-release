import { spawn } from 'child_process'

export default function (cb) {
  // npm loads package.json data before running the `prepublish` hook
  // changing the version on `prepublish` has no effect
  // see https://github.com/npm/npm/issues/7118
  // to circumvent this behavior we are calling `npm publish` inside `prepublish`
  // the package.json is then loaded again and the correct version will be published

  const child = spawn('npm', ['publish', '--semantic-release-rerun'])
  const handler = exports.handleCloseAndExit.bind(null, cb)

  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)

  child.on('close', handler)
  child.on('exit', handler)
  child.on('error', cb)
}

export function handleCloseAndExit (cb, code, signal) {
  if (code === 0) return cb(null)
  cb({
    code,
    signal,
    message: 'npm publish failed'
  })
}
