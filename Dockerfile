## Base images
# The general concept is to build in build-base, then copy into a slimmer run-base
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock license ./

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
COPY .yarnrc common.* ./
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


## Build custom version of Caddy with Brotli support
FROM caddy:2-builder AS build-caddy
RUN xcaddy build \
    --with github.com/ueffel/caddy-brotli


## Build the frontend
FROM build-base as build-frontend
RUN apk add zstd brotli
COPY packages/ packages/
RUN scripts/docker-build.sh web


## Minimal image to serve the frontend
FROM run-base as frontend
COPY --from=build-caddy /usr/bin/caddy /usr/bin/caddy
COPY packages/desktop/Caddyfile.docker /etc/caddy/Caddyfile
COPY --from=build-frontend /app/packages/desktop/dist/ .
COPY --from=metadata /meta/ /meta/
ENTRYPOINT ["/usr/bin/caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
