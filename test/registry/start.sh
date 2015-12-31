#!/bin/bash

# exit if an error occurs
set -e

cd $(dirname $0)

mkdir -p couch

if [[ $TRAVIS = true ]]
then
  COUCH=http://admin:password@127.0.0.1:5984

  curl -X PUT http://127.0.0.1:5984/_config/admins/admin -d '"password"'

  curl -X PUT $COUCH/_config/couchdb/delayed_commits -d '"false"'
  curl -X PUT $COUCH/_config/couch_httpd_auth/users_db_public -d '"true"'
  curl -X PUT $COUCH/_config/couch_httpd_auth/public_fields -d '"appdotnet, avatar, avatarMedium, avatarLarge, date, email, fields, freenode, fullname, github, homepage, name, roles, twitter, type, _id, _rev"'
  curl -X PUT $COUCH/_config/httpd/secure_rewrites -d '"false"'

else
  COUCH=http://admin:password@127.0.0.1:15986
  couchdb -b -a local.ini -p couch/pid -o couch/stdout.log -e couch/stderr.log
  # wait for couch to start
  sleep 1
fi

# create "registry" database
curl -X PUT $COUCH/registry

# create sample npm user
curl -X PUT $COUCH/_users/org.couchdb.user:integration -H Content-Type:application/json --data-binary '{"_id": "org.couchdb.user:integration", "name": "integration", "roles": [], "type": "user", "password": "suchsecure", "email": "integration@test.com"}'

# npm-registry-couchpp needs this variable set to run
export DEPLOY_VERSION=nope

# setup npm-registry-couchapp
npm explore npm-registry-couchapp -- npm start --npm-registry-couchapp:couch=$COUCH/registry
npm explore npm-registry-couchapp -- npm run load --npm-registry-couchapp:couch=$COUCH/registry
npm explore npm-registry-couchapp -- NO_PROMPT=yes npm run copy --npm-registry-couchapp:couch=$COUCH/registry
