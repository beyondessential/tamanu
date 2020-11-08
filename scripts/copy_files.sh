#!/bin/bash
echo "Copying files to /tamanu"
rm -rf /tamanu/scripts
mkdir -p /tamanu
cd /.tmp
mv packages/ /tamanu/.
mv scripts/ /tamanu/.
mv .git /tamanu/.
mv package.json /tamanu/.
mv yarn.lock /tamanu/.
mv babel.config.js /tamanu/.
mv *.pm2.config.js /tamanu/.
rm -rf /.tmp
