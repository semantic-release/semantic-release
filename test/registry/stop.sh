#!/bin/bash

# close couchdb background process
couchdb -d

# delete data and logs
cd $(dirname $0)

cat couch/{couch,stdout,stderr}.log

cat couch/pid | xargs kill
rm -rf couch
rm -rf data
