var fs = require('fs');

module.exports = {
  writeFile: fs.writeFile,
  readFileSync: fs.readFileSync,
  createWriteStream: fs.createWriteStream
};
