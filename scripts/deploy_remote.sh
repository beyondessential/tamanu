#!/bin/bash
type=$1
branch=$2
filename=$3
basedir=$PWD
dir=${PWD}/tamanu-${type}-${branch}
dir_bk=${dir}.bk
dir_tmp=${dir}.tmp
app_name="server-${type}-${branch}"
pm2='/home/ubuntu/.npm-global/bin/pm2'
export NODE_ENV='production'
export DB_BASE_PATH="${basedir}/data/"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm use 10.14.0
node -v

echo "Setting up - ${branch}"
rm -rf ${dir_bk}
rm -rf ${dir_tmp}
mkdir -p ${dir}
mkdir -p ${dir_tmp}
mkdir -p ${DB_BASE_PATH}
unzip -q ./${filename} -d ${dir_tmp}/
echo "unzip ${filename} > ${dir_tmp}"

cd ${dir_tmp}
rm -rf ${dir_tmp}/**/node_modules
yarn install
$pm2 delete "${app_name}"

cd ../../
echo "${dir} > ${dir_bk}" \
  && mv ${dir} ${dir_bk} || echo " " \
  && echo "${dir_tmp} > ${dir}" \
  && mv ${dir_tmp} ${dir} || echo " "
rm -rf ${dir_bk}

cd ${dir}/packages/server/
$pm2 start --name "${app_name}" index.js
$pm2 log --nostream --lines 20 "${app_name}"