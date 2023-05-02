### This is the production-grade Linux container. You may be looking for:
### - the CodeShip containers, at Dockerfile.codeship and Dockerfile.deploy
### - the development containers, at packages/*/docker/Dockerfile

FROM node:16-alpine AS base
RUN apk add --no-cache \
    --virtual .build-deps \
    make \
    gcc \
    g++ \
    python \
    jq

WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock .yarnrc common.* babel.config.js license scripts/docker-build-server.sh ./


# Build the shared sources only
FROM base as shared
RUN mkdir -p packages/shared-src
COPY packages/shared-src/ packages/shared-src/
RUN true \
    && yarn install --non-interactive --frozen-lockfile \
    && yarn build-shared
# We don't bother cleaning up, as we're only going to copy the parts we want.
# This means that other packages can't depend directly on shared-src; they
# shouldn't anyway but this makes it a hard requirement.


# Build the central server
FROM base as central
LABEL tamanu.product=central
# this label makes it possible to build and tag all images in one step

# Start with just the package.json and shared packages, for caching purposes
RUN mkdir -p packages/sync-server
COPY packages/sync-server/package.json packages/sync-server/
COPY --from=shared packages/shared packages/
RUN true \
    && yarn install --non-interactive --frozen-lockfile \
    && yarn cache clean

# Actually build now
COPY packages/sync-server/ packages/sync-server/
RUN yarn workspace sync-server build
ENTRYPOINT ["node", "dist/app.bundle.js"]
CMD "serve"


# Build the facility server
FROM base as facility
LABEL tamanu.product=facility

RUN mkdir -p packages/lan
COPY packages/lan/package.json packages/lan/
COPY --from=shared packages/shared packages/
RUN true \
    && yarn install --non-interactive --frozen-lockfile \
    && yarn cache clean

COPY packages/lan/ packages/lan/
RUN yarn workspace lan build
ENTRYPOINT ["node", "dist/app.bundle.js"]
CMD "serve"


# Build the meta server
FROM base as meta
LABEL tamanu.product=meta

RUN mkdir -p packages/meta-server
COPY packages/meta-server/package.json packages/meta-server/
COPY --from=shared packages/shared packages/
RUN true \
    && yarn install --non-interactive --frozen-lockfile \
    && yarn cache clean

COPY packages/meta-server/ packages/meta-server/
RUN yarn workspace meta-server build
ENTRYPOINT ["node", "dist/app.bundle.js"]
CMD "serve"
