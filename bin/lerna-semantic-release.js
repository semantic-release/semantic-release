#!/usr/bin/env node

var task = process.argv[2];

var fs = require('../src/io/fs');
var git = require('../src/io/git');
var lerna = require('../src/io/lerna');
var npm = require('../src/io/npm');
var semanticRelease = require('../src/io/semantic-release');
var shell = require('../src/io/shell');

var tasks = {
  pre: require('../src/pre'),
  perform: require('../src/perform'),
  post: require('../src/post')
};

tasks[task]({
  io: {
    fs: fs,
    npm: npm,
    git: git,
    lerna: lerna,
    shell: shell,
    semanticRelease: semanticRelease
  }
});
