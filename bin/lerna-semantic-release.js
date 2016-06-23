#!/usr/bin/env node

var task = process.argv[2];
var io = require('../src/io');

var tasks = {
  pre: require('../src/pre'),
  perform: require('../src/perform'),
  post: require('../src/post')
};

function erorrHandler(err) {
  console.error(err);
  process.exit(+!!err);
}

try {
  tasks[task]({
    io: io,
    callback: erorrHandler
  });
} catch(err) {
  erorrHandler(err);
}
