FROM node:16-alpine

WORKDIR /app
ARG NODE_NATIVE_BUILD_DEPS="make gcc g++ python"

# install deps
COPY packages/sync-server/package.json yarn.lock .
RUN apk add --no-cache --virtual .build-deps $NODE_NATIVE_BUILD_DEPS && \
    yarn install --non-interactive --frozen-lockfile --production && \
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
CMD ["sh", "-c" , "node dist/app.bundle.js setup; node dist/app.bundle.js serve"]
