#!/usr/bin/env node

var task = process.argv[2];

var npm = require('../src/io/npm');
var git = require('../src/io/git');
var fs = require('../src/io/fs');
var shell = require('../src/io/shell');

var tasks = {
  pre: require('../src/pre'),
  perform: require('../src/perform'),
  post: require('../src/post')
};

tasks[task]({
  io: {
    npm: npm,
    git: git,
    shell: shell,
    fs: fs
  }
});
