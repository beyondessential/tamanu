FROM node:12-alpine

WORKDIR /app

# install deps
COPY packages/sync-server/package.json yarn.lock .
RUN apk add --no-cache --virtual .build-deps make gcc g++ python && \
    yarn install --non-interactive --pure-lockfile --production && \
    yarn cache clean && \
    apk del .build-deps

# copy shared
COPY packages/shared/ node_modules/shared

# copy config
COPY packages/sync-server/config/default.json config/
COPY packages/sync-server/docker/local.json config/

# copy bundle
COPY packages/sync-server/dist/app.bundle.js dist/

# run config
EXPOSE 3000
CMD ["node", "dist/app.bundle.js"]
