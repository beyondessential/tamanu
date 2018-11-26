FROM node:10.13-jessie

WORKDIR /usr/tamanu

RUN apt-get update && npm install -g yarn

COPY * .
# RUN yarn config set workspaces-experimental true && yarn config set workspaces-nohoist-experimental true
# RUN yarn --silent
# RUN cd ./packages/lan && yarn add json-prune
# RUN cd ./packages/server && yarn add config
RUN ls -lash