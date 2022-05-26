FROM node:12-alpine

WORKDIR /app
ARG NODE_NATIVE_BUILD_DEPS="make gcc g++ python"

# install deps
COPY packages/lan/package.json yarn.lock .
RUN apk add --no-cache --virtual .build-deps $NODE_NATIVE_BUILD_DEPS && \
    yarn install --non-interactive --frozen-lockfile --production && \
    yarn cache clean && \
    apk del .build-deps

# copy shared
COPY packages/shared/ node_modules/shared

# copy config
COPY packages/lan/config/default.json config/
COPY packages/lan/docker/local.json config/

# copy bundle
COPY packages/lan/dist/app.bundle.js dist/

# run config
EXPOSE 4000
CMD ["node", "dist/app.bundle.js"]
