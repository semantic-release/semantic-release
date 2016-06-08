#!/usr/bin/env node

var task = process.argv[2];

var npm = require('./services/npm');
var git = require('./services/git');

var tasks = {
  pre: require('../src/pre'),
  perform: require('../src/perform'),
  post: require('../src/post')
};

tasks[task]({
  services: {
    npm: npm,
    git: git
  }
});
