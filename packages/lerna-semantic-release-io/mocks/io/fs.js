var fs = require('fs');
var mock = require('mock-fs');

module.exports = {
  mock: function (fsState) {
    mock(fsState);
  },
  restore: function () {
    mock.restore();
  },
  writeFile: fs.writeFile,
  readFileSync: fs.readFileSync,
  createWriteStream: fs.createWriteStream
};
