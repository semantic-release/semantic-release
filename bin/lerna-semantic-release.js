#!/usr/bin/env node

var task = process.argv[2];

var tasks = {
  pre: require('../src/pre'),
  perform: require('../src/perform'),
  post: require('../src/post')
};

tasks[task]();