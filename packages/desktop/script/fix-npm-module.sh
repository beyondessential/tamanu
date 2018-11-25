#!/bin/sh
file_path="./node_modules/dotenv-webpack/index.js"
content="const { default: plugin } = require('./dist');\n\nmodule.exports = plugin;";
if [ ! -f "${file_path}" ]; then
  file_path = "../../../node_modules/dotenv-webpack/index.js"
fi
echo "${content}" > "${file_path}"
echo "NPM module {dotenv-webpack} updated123 "
echo "cwd ${file_path}"
