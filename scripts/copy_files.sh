#!/bin/bash
echo "Copying files to /tamanu"

# ensure target directory is clean & exists
rm -rf ./deploy
mkdir -p deploy

# set up repo
rm -rf /tamanu/scripts
mkdir -p /tamanu
cd /.tmp
mv packages/ /tamanu/.
mv scripts/ /tamanu/.
mv .git /tamanu/.
mv package.json /tamanu/.
mv yarn.lock /tamanu/.
mv babel.config.js /tamanu/.
rm -rf /.tmp
