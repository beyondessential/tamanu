## Base images
# The general concept is to build in build-base, then copy into a slimmer run-base
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json COPYRIGHT LICENSE-GPL LICENSE-BSL ./
COPY patches/ patches/

FROM base AS build-base
RUN apk add --no-cache \
  --virtual .build-deps \
  bash \
  g++ \
  gcc \
  git \
  jq \
  make \
  python3 \
  py3-setuptools \
  && npm install -g node-gyp
COPY common.* ./
COPY scripts/ scripts/

FROM base AS run-base
ENV NODE_ENV=production
RUN apk add --no-cache bash curl jq
# set the runtime options
COPY scripts/docker-entrypoint.sh /entrypoint
ENTRYPOINT ["/entrypoint"]
CMD ["serve"]


## Build the target server
FROM build-base AS build-server
ARG PACKAGE_PATH

# copy all packages
COPY packages/ packages/

# do the build, which will also reduce to just the target package
RUN scripts/docker-build.sh ${PACKAGE_PATH}
RUN npm prune --production


## Normal final target for servers
FROM run-base AS server
# restart from a fresh base without the build tools
ARG PACKAGE_PATH
# FROM resets the ARGs, so we need to redeclare it

# copy the built packages and their deps
COPY --from=build-server /app/packages/ packages/
COPY --from=build-server /app/node_modules/ node_modules/
COPY alerts alerts/

# set the working directory, which is where the entrypoint will run
WORKDIR /app/packages/${PACKAGE_PATH}

# explicitly configure the port
ENV PORT=3000
EXPOSE 3000

# read configuration from source and from /config
#
# NOTE: We also explicitly set this value in central-server/pm2.config.cjs for when running in production
# but the two values should resolve to the same path
ENV NODE_CONFIG_DIR=/config:/app/packages/${PACKAGE_PATH}/config


## Build the frontend packages (web or patient-portal)
FROM build-base AS build-frontend-base
ARG PACKAGE_PATH
RUN apk add zstd brotli
COPY packages/ packages/
RUN scripts/docker-build.sh ${PACKAGE_PATH}

## Minimal image to serve frontend packages
FROM alpine AS frontend-base
ARG PACKAGE_PATH
WORKDIR /app
ENTRYPOINT ["/usr/bin/caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
COPY --from=caddy:2-alpine /usr/bin/caddy /usr/bin/caddy
COPY packages/${PACKAGE_PATH}/Caddyfile.docker /etc/caddy/Caddyfile
COPY --from=build-frontend-base /app/packages/${PACKAGE_PATH}/dist/ .

## Specific targets for each frontend
FROM frontend-base AS frontend

FROM frontend-base AS patient-portal


## Toolbox image
FROM rust AS build-bestool
RUN cargo install bestool --no-default-features \
  -F completions \
  -F crypto \
  -F file \
  -F tamanu

FROM ubuntu AS toolbox
RUN apt update && apt install -y --no-install-recommends \
  age \
  ca-certificates \
  curl \
  fish \
  jq \
  minisign \
  neovim \
  pipx \
  postgresql-client \
  ripgrep \
  wget \
  zstd
RUN \
  curl -L --proto '=https' --tlsv1.2 -sSf -o step-cli.deb \
  "https://dl.smallstep.com/cli/docs-cli-install/latest/step-cli_$(dpkg --print-architecture).deb" \
  && dpkg -i step-cli.deb \
  && rm step-cli.deb
RUN \
  pipx ensurepath \
  && pipx install dbt-core \
  && pipx inject dbt-core dbt-postgres
COPY --from=build-bestool /usr/local/cargo/bin/bestool /usr/bin/bestool
COPY alerts /alerts
COPY database /database
