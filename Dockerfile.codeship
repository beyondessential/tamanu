FROM node:16.16.0 as base
RUN dpkg --add-architecture i386 \
    && apt update \
    && apt install -y \
        apt-transport-https \
        build-essential \
        jq \
        msitools \
        unzip \
        wine32 \
        wine \
        wixl \
        zip \
    && mkdir /pre /tamanu
WORKDIR /pre


# Copy JUST the package.jsons from all the packages
# in a separate step from prebuild so we don't cachebust it
FROM base as yarnprep
COPY package.json yarn.lock .yarnrc ./
COPY packages/ pkgs/
RUN for pkg in $(ls pkgs); do if test -s pkgs/$pkg/package.json; then mkdir -p packages/$pkg && mv -v pkgs/$pkg/package.json packages/$pkg/; fi; done


# Assemble the packages source plus the yarn cache
# Cache optimisation: COPYs in order of least to most likely to change
FROM base as final
ENV DEPLOY_DIR=/tamanu/deploy \
    DESKTOP_RELEASE_DIR=/tamanu/packages/desktop/release \
    DESKTOP_ROOT=/tamanu/packages/desktop \
    LAN_RELEASE_DIR=/tamanu/packages/lan/release \
    LAN_ROOT=/tamanu/packages/lan \
    PACKAGES_DIR=/tamanu/packages \
    SYNC_SERVER_ROOT=/tamanu/packages/sync-server

# Download the dependencies into the yarn cache
COPY --from=yarnprep /pre/package.json /pre/yarn.lock /pre/.yarnrc ./
COPY --from=yarnprep /pre/packages/ packages/
RUN yarn install --non-interactive --frozen-lockfile \
    && rm -rf node_modules packages/*/node_modules

# Tool configs
COPY babel.config.js .eslintignore .eslintrc .prettierignore .prettierrc common.webpack.config.mjs ./

# Rest of the source
COPY scripts/ scripts/
COPY packages/ packages/

# Where we'll work, but we'll copy /pre into it at runtime so we can share that
# space at runtime between steps (CodeShip limitation).
WORKDIR /tamanu
