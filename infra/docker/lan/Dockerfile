FROM node:12

ARG DEBIAN_FRONTEND=noninteractive

# install deps
RUN apt-get update -y -qq
RUN apt-get install -y -qq --no-install-recommends \
        apt-transport-https \
        build-essential \
        ca-certificates

WORKDIR /app

# install deps
COPY packages/lan/package.json yarn.lock .
RUN yarn install --non-interactive --pure-lockfile --production

# copy shared
COPY packages/shared/ node_modules/shared

# copy config
COPY packages/lan/config/default.json config/
COPY infra/docker/lan/local.json config/

# copy bundle
COPY packages/lan/dist/app.bundle.js dist/

# run config
EXPOSE 4000
CMD ["node", "dist/app.bundle.js"]
