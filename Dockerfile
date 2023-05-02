### This is the production-grade Linux container. You may be looking for:
### - the CodeShip containers, at Dockerfile.codeship and Dockerfile.deploy
### - the development containers, at packages/*/docker/Dockerfile

## Build the base system and image setup
FROM node:16-alpine AS base
RUN apk add --no-cache \
    --virtual .build-deps \
    make \
    gcc \
    g++ \
    python3 \
    bash \
    jq

WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock .yarnrc common.* babel.config.js license scripts/docker-build-server.sh ./


## Build the central server
FROM base as central
# this first one is commented to explain, the next two are the same so compacted

# this label makes it possible to build and tag all images in one step
LABEL tamanu.product=central

# copy sources
COPY packages/build-tooling/ packages/build-tooling/
COPY packages/shared/ packages/shared/
COPY packages/sync-server/ packages/sync-server/

# do the actual build
RUN ./docker-build-server.sh sync-server && rm ./docker-build-server.sh

# set the runtime
WORKDIR /app/packages/sync-server
ENTRYPOINT ["node", "dist/app.bundle.js"]
CMD ["serve"]


## Build the facility server
FROM base as facility
LABEL tamanu.product=facility
COPY packages/build-tooling/ packages/build-tooling/
COPY packages/shared/ packages/shared/
COPY packages/lan/ packages/lan/
RUN ./docker-build-server.sh lan && rm ./docker-build-server.sh
WORKDIR /app/packages/lan
ENTRYPOINT ["node", "dist/app.bundle.js"]
CMD ["serve"]


## Build the meta server
FROM base as meta
LABEL tamanu.product=meta
COPY packages/build-tooling/ packages/build-tooling/
COPY packages/shared/ packages/shared/
COPY packages/meta-server/ packages/meta-server/
RUN ./docker-build-server.sh meta-server && rm ./docker-build-server.sh
WORKDIR /app/packages/meta-server
ENTRYPOINT ["node", "dist/app.bundle.js"]
CMD ["serve"]
