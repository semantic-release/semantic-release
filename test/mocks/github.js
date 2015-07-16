module.exports = () => ({
  authenticate: () => true,
  releases: {
    createRelease: (release, cb) => cb(null)
  }
})
