#!/bin/bash
echo "Copying files to /tamanu"
rm -rf /tamanu/scripts
mkdir -p /tamanu
cp -r /.tmp/packages/ /tamanu/packages/
cp -r /.tmp/scripts/ /tamanu/scripts/
cp /.tmp/package.json /tamanu/.
cp /.tmp/yarn.lock /tamanu/.
cp /.tmp/babel.config.js /tamanu/.
cp /.tmp/babel.config.js /tamanu/.
cp /.tmp/*.pm2.config.js /tamanu/.
rm -rf /.tmp
