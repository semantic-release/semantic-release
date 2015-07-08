#!/bin/bash

# exit if an error occurs
set -e

cd $(dirname $0)

# start couchdb as a background process, reset config, load local config
couchdb -b -a local.ini

COUCH=http://admin:password@127.0.0.1:5984

# create "registry" database
curl -X PUT $COUCH/registry

# create sample npm user
curl -X PUT $COUCH/_users/org.couchdb.user:integration -H Content-Type:application/json --data-binary '{"_id": "org.couchdb.user:integration","name": "integration","roles": [],"type": "user","password": "suchsecure","email": "integration@test.com"}'

# npm-registry-couchpp needs this variable set to run
export DEPLOY_VERSION=nope

# setup npm-registry-couchapp
npm explore npm-registry-couchapp -- npm start --npm-registry-couchapp:couch=$COUCH/registry
npm explore npm-registry-couchapp -- npm run load --npm-registry-couchapp:couch=$COUCH/registry
npm explore npm-registry-couchapp -- NO_PROMPT=yes npm run copy --npm-registry-couchapp:couch=$COUCH/registry
