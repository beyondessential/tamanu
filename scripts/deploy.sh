#!/bin/bash
type=$1
type_upper=${type^^}
url="${type_upper}_SERVER_URL"
url=${!url}
user="$(cut -d'@' -f1 <<<"$url")"
host="$(cut -d'@' -f2 <<<"$url")"
filename="server-${type}-${CI_BRANCH}-${CI_COMMIT_ID}.zip"
dir=/home/${user}/

echo "Deploying - ${type}"
echo "zip file ${filename}"
mkdir -p /root/.ssh
ssh-keyscan -H ${host} >> /root/.ssh/known_hosts
echo "known_hosts updated"

scp ./scripts/deploy_remote.sh ./deploy/${filename} ${url}:${dir}
echo "scp done"

ssh ${url} ${dir}/deploy_remote.sh ${type} ${CI_BRANCH} ${filename}
echo "ssh done"