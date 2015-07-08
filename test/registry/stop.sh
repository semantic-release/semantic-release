#!/bin/bash

# delete "registry" database
curl -X DELETE http://admin:password@127.0.0.1:5984/registry

# delete "_users" database
curl -X DELETE http://admin:password@127.0.0.1:5984/_users

# close couchdb background process
couchdb -d
