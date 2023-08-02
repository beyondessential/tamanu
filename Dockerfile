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
COPY yarn.lock .yarnrc common.* babel.config.js scripts ./

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


## Build the shared packages and get their dependencies
FROM build-base as shared
COPY packages/build-tooling/ packages/build-tooling/
COPY packages/api-client/ packages/api-client/
COPY packages/constants/ packages/constants/
COPY packages/shared/ packages/shared/
RUN scripts/docker-build-server.sh


## Build the target server
FROM build-base as build-server
ARG PACKAGE_PATH

# copy the shared packages and their deps (+ build tooling)
COPY --from=shared /app/packages/ packages/

# copy sources only for the target server
COPY packages/${PACKAGE_PATH}/ packages/${PACKAGE_PATH}/

# do the build
RUN scripts/docker-build-server.sh ${PACKAGE_PATH}


## Special target for packaging the desktop app
# layer efficiency or size doesn't matter as this is not distributed
FROM electronuserland/builder:16-wine AS build-desktop
RUN apt update && apt install -y jq
WORKDIR /project
COPY --from=build-base /app/ ./
COPY --from=shared /app/packages/ packages/
COPY packages/desktop/ packages/desktop/
RUN yarn workspace desktop install --non-interactive --frozen-lockfile
RUN yarn workspace desktop build
ENV NODE_ENV=production
WORKDIR /project/packages/desktop
RUN jq '.build.win.target = ["nsis"] | .build.nsis.perMachine = false | .build.directories.output = "release/appdata"' \
    package.json > /package-appdata.json
RUN jq '.build.win.target = ["msi"] | .build.msi.shortcutName = "Tamanu \(.version)"' \
    package.json > /package-msi.json
RUN jq '.build.productName = "Tamanu Fiji" | .build.appId = "org.beyondessential.TamanuFiji" | .build.directories.output = "release/aspen"' \
    /package-msi.json > /package-aspen.json
RUN jq '.build.mac.target = "tar.xz"' \
    package.json > /package-mac.json


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
