## Base images
# The general concept is to build in build-base, then copy into a slimmer run-base
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock COPYRIGHT LICENSE-GPL LICENSE-BSL ./

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

# set the working directory, which is where the entrypoint will run
WORKDIR /app/packages/${PACKAGE_PATH}

# explicitly reconfigure the port
RUN echo '{"port":3000}' > config/local.json
EXPOSE 3000


## Build the frontend
FROM build-base as build-frontend
RUN apk add zstd brotli
COPY packages/ packages/
RUN scripts/docker-build.sh web


## Minimal image to serve the frontend
FROM alpine as frontend
WORKDIR /app
ENTRYPOINT ["/usr/bin/caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
COPY --from=caddy:2-alpine /usr/bin/caddy /usr/bin/caddy
COPY packages/web/Caddyfile.docker /etc/caddy/Caddyfile
COPY --from=build-frontend /app/packages/web/dist/ .
