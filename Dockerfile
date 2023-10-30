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
    bash \
    g++ \
    gcc \
    git \
    jq \
    make \
    python3
COPY yarn.lock .yarnrc common.* babel.config.js ./
COPY scripts/ scripts/

FROM base AS run-base
RUN apk add --no-cache bash curl jq
# set the runtime options
COPY scripts/docker-entrypoint.sh /entrypoint
ENTRYPOINT ["/entrypoint"]
CMD ["serve"]


## Get some build metadata information
FROM build-base as metadata
COPY .git/ .git/
RUN mkdir /meta
RUN git rev-parse --abbrev-ref HEAD | tee /meta/SOURCE_BRANCH
RUN git log -1 --pretty=%H          | tee /meta/SOURCE_COMMIT_HASH
RUN git log -1 --pretty=%s          | tee /meta/SOURCE_COMMIT_SUBJECT
RUN git log -1 --pretty=%cs         | tee /meta/SOURCE_DATE
RUN git log -1 --pretty=%ct         | tee /meta/SOURCE_DATE_EPOCH
RUN git log -1 --pretty=%cI         | tee /meta/SOURCE_DATE_ISO


## Build the target server
FROM build-base as build-server
ARG PACKAGE_PATH

# copy all packages
COPY packages/ packages/

# do the build, which will also reduce to just the target package
RUN scripts/docker-build.sh ${PACKAGE_PATH}


## Special target for packaging the desktop app
# layer efficiency or size doesn't matter as this is not distributed
FROM electronuserland/builder:16-wine AS build-desktop
RUN apt update && apt install -y jq
COPY --from=build-base /app/ /app/
WORKDIR /app
COPY packages/ packages/
RUN scripts/docker-build.sh desktop
ENV NODE_ENV=production
WORKDIR /app/packages/desktop


## Normal final target for servers
FROM run-base as server
# restart from a fresh base without the build tools
ARG PACKAGE_PATH
# FROM resets the ARGs, so we need to redeclare it

# copy the built packages and their deps
COPY --from=build-server /app/packages/ packages/
COPY --from=build-server /app/node_modules/ node_modules/
COPY --from=metadata /meta/ /meta/

# set the working directory, which is where the entrypoint will run
WORKDIR /app/packages/${PACKAGE_PATH}

# explicitly reconfigure the port
RUN echo '{"port":3000}' > config/local.json
EXPOSE 3000
