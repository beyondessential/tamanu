### This is the production-grade Linux container. You may be looking for:
### - the CodeShip containers, at Dockerfile.codeship and Dockerfile.deploy
### - the development containers, at packages/*/docker/Dockerfile

## Base images
# The general concept is to build in build-base, then copy into a slimmer run-base
FROM node:16-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
COPY package.json license ./

FROM base AS build-base
RUN apk add --no-cache \
    --virtual .build-deps \
    make \
    gcc \
    g++ \
    python3 \
    bash \
    jq
COPY yarn.lock .yarnrc common.* babel.config.js scripts/docker-build-server.sh ./

FROM base AS run-base
# set the runtime options
ENTRYPOINT ["node", "dist/app.bundle.js"]
CMD ["serve"]


## Build the shared packages and get their dependencies
FROM build-base as shared
COPY packages/build-tooling/ packages/build-tooling/
COPY packages/shared/ packages/shared/
RUN ./docker-build-server.sh


## Build the central server
FROM build-base as build-central
# this first one is commented to explain, the next two are the same so compacted

# copy the shared packages and their deps (+ build tooling)
COPY --from=shared /app/packages/ packages/

# copy sources only for the target server
COPY packages/sync-server/ packages/sync-server/

# do the build
RUN ./docker-build-server.sh sync-server

# restart from a fresh base without the build tools
FROM run-base as central

# this label makes it possible to discover what an image is without relying on tags
LABEL tamanu.product=central

# copy the built packages and their deps
COPY --from=build-central /app/packages/ packages/
COPY --from=build-central /app/node_modules/ node_modules/

# set the working directory, which is where the entrypoint will run
WORKDIR /app/packages/sync-server


## Build the facility server
FROM build-base as build-facility
COPY --from=shared /app/packages/ packages/
COPY packages/lan/ packages/lan/
RUN ./docker-build-server.sh lan
FROM run-base as facility
LABEL tamanu.product=facility
COPY --from=build-facility /app/packages/ packages/
COPY --from=build-facility /app/node_modules/ node_modules/
WORKDIR /app/packages/lan


## Build the meta server
FROM build-base as build-meta
COPY --from=shared /app/packages/ packages/
COPY packages/meta-server/ packages/meta-server/
RUN ./docker-build-server.sh meta-server
FROM run-base as meta
LABEL tamanu.product=meta
COPY --from=build-meta /app/packages/ packages/
COPY --from=build-meta /app/node_modules/ node_modules/
WORKDIR /app/packages/meta-server
