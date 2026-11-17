## Base images
# The general concept is to build in build-base, then copy into a slimmer run-base
FROM node:26-alpine AS base
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
COPY .npmrc common.* ./
COPY scripts/ scripts/

FROM base AS run-base
ENV NODE_ENV=production
RUN apk add --no-cache bash curl jq
# drop distrusted root CAs from the system bundle, then from Node's own store in every node process
# (the entrypoint also imports it, so the app keeps it if NODE_OPTIONS is overridden at deploy time)
COPY packages/shared/src/utils/distrustedRootCas.mjs packages/shared/src/utils/distrustedRootCas.mjs
RUN node packages/shared/src/utils/distrustedRootCas.mjs
ENV NODE_OPTIONS="--import /app/packages/shared/src/utils/distrustedRootCas.mjs"
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
RUN DOCKER_BUILD=1 scripts/docker-build.sh ${PACKAGE_PATH}


## Normal final target for servers
FROM run-base AS server
# restart from a fresh base without the build tools
ARG PACKAGE_PATH
# FROM resets the ARGs, so we need to redeclare it

# copy the built packages and their deps
COPY --from=build-server /app/packages/ packages/
COPY --from=build-server /app/node_modules/ node_modules/
# needed by the root `prepare` script
COPY scripts/run-patch-package.mjs scripts/run-patch-package.mjs

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


## Build the seed image: the central server, to run the migrations, plus the
## scripts package, which holds the fake-data generator
FROM build-base AS build-seed
COPY packages/ packages/
RUN DOCKER_BUILD=1 scripts/docker-build.sh central-server scripts


## Seeds a fresh database for the pgsnap operator to snapshot, then exits
FROM run-base AS seed
COPY --from=build-seed /app/packages/ packages/
COPY --from=build-seed /app/node_modules/ node_modules/
WORKDIR /app/packages/central-server
ENV NODE_CONFIG_DIR=/app/packages/central-server/config \
    ROUNDS=50
ENTRYPOINT ["bash", "-euc"]
# DB_* come from the connection Secret the pgsnap operator injects via envFrom.
# ROUNDS sets the fake-data volume; override it to scale the snapshot's size.
# The scrub runs last: migrate provisions secrets encrypted with this image's key file,
# which the deploy restoring the snapshot doesn't have, so they must not ship in it.
CMD ["\
export CONFIG_SYNC_DB_HOST=\"$DB_HOST\" CONFIG_SYNC_DB_PORT=\"$DB_PORT\" \
       CONFIG_SYNC_DB_NAME=\"$DB_NAME\" CONFIG_SYNC_DB_USERNAME=\"$DB_USERNAME\" \
       CONFIG_SYNC_DB_PASSWORD=\"$DB_PASSWORD\"\n\
node --import tsx app migrate\n\
node --import tsx ../scripts/src/fake.mts \
  --database \"$DB_NAME\" \
  --rounds \"$ROUNDS\" \
  --from-tally ../fake-data/src/populateDb/parseTally/standard.json\n\
node --import tsx ../scripts/src/scrubSeedSecrets.mts\
"]


## Build the supervisor, stamped with the Tamanu release from the root package.json
FROM golang:1.27-alpine AS build-supervisor
WORKDIR /src
COPY packages/supervisor/go.mod packages/supervisor/go.sum ./
RUN go mod download
COPY packages/supervisor/ ./
COPY package.json /tamanu/package.json
RUN version="$(sed -n 's/^  "version": "\([^"]*\)",$/\1/p' /tamanu/package.json)" \
  && test -n "$version" \
  && CGO_ENABLED=0 go build -trimpath \
    -ldflags "-X github.com/beyondessential/tamanu/packages/supervisor/internal/buildinfo.Version=${version}" \
    -o /supervisor ./cmd/supervisor

## Build the web app
FROM build-base AS build-web
COPY packages/ packages/
RUN DOCKER_BUILD=1 scripts/docker-build.sh web

## Build the patient portal
FROM build-base AS build-patient-portal
COPY packages/ packages/
RUN DOCKER_BUILD=1 scripts/docker-build.sh patient-portal

## Minimal image to serve frontend packages, with the supervisor as its Caddy.
## By default it serves the frontend at /app with its Caddyfile, for deployments that
## route to the server's parts themselves; started with `tamanu-supervisor` it runs the supervisor.
FROM alpine AS frontend-base
RUN adduser -D -u 10001 supervisor
COPY --from=build-supervisor /supervisor /usr/bin/caddy
ENTRYPOINT ["/usr/bin/caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

## The web app's image, which is also the supervisor's: it carries the patient portal too.
## The web app's dist lacks Tamanu's error pages, so they are copied in beside it.
FROM frontend-base AS frontend
COPY --from=build-web /app/packages/web/dist/ /srv/web/
COPY packages/web/resources/errors/ /srv/web/resources/errors/
COPY --from=build-patient-portal /app/packages/patient-portal/dist/ /srv/patient-portal/
COPY packages/web/Caddyfile.docker /etc/caddy/Caddyfile
RUN ln -s /srv/web /app
ENV TAMANU_SUPERVISOR_WEB_ROOT=/srv/web \
  TAMANU_SUPERVISOR_PORTAL_ROOT=/srv/patient-portal
USER supervisor
EXPOSE 3000 8080

## The patient portal's image, for deployments that route to the server's parts themselves
FROM frontend-base AS patient-portal
COPY --from=build-patient-portal /app/packages/patient-portal/dist/ /srv/patient-portal/
COPY packages/patient-portal/Caddyfile.docker /etc/caddy/Caddyfile
RUN ln -s /srv/patient-portal /app
USER supervisor
EXPOSE 3000


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
COPY database /database
