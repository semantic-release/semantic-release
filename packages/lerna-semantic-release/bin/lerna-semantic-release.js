#!/usr/bin/env node

var task = process.argv[2];
var io = require('lerna-semantic-release-io').default;

var tasks = {
  pre: require('lerna-semantic-release-pre'),
  perform: require('lerna-semantic-release-perform'),
  post: require('lerna-semantic-release-post')
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
