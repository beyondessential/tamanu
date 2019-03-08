export NODE_ENV='development'
export DB_BASE_PATH="/home/ubuntu/data/"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm use 10.14.0
node -v
node index
(ctrl-c)
cd ~/data/
mv demo-dev demo-dev-backup-190308
mv ~/tamanu-demo-dev/packages/server/data ./demo-dev
pm2 restart server-demo-dev

---------
DB_BASE_PATH=/home/ubuntu/data NODE_ENV=production pm2 start  index.js --name server-demo-dev --env production && pm2 logs
