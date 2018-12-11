#!/bin/bash
echo "Copying files to /tamanu"
rm -rf /tamanu/scripts
mkdir -p /tamanu
cp -r /.tmp/packages/ /tamanu/packages/
cp -r /.tmp/scripts/ /tamanu/scripts/
cp -r /.tmp/package.json /tamanu/
cp -r /.tmp/yarn.lock /tamanu/
rm -rf /.tmp
