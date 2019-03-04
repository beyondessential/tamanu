pm2 delete server-demo-dev
export NODE_ENV='development'
export DB_BASE_PATH="/home/ubuntu/data/"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm use 10.14.0
node -v
pm2 start -name server-demo-dev node
