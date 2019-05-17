#!/bin/bash
echo "Copying files to /tamanu"
rm -rf /tamanu/scripts
mkdir -p /tamanu
cp -r /.tmp/packages/ /tamanu/packages/
cp -r /.tmp/scripts/ /tamanu/scripts/
cp -r /.tmp/package.json /tamanu/
cp -r /.tmp/yarn.lock /tamanu/
cp -r /.tmp/babel.config.js /tamanu/
rm -rf /.tmp
