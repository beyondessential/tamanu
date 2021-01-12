FROM node:12.16.3 as base_image
RUN dpkg --add-architecture i386
RUN apt-get update
RUN apt-get install -y -q --no-install-recommends \
        apt-transport-https \
        build-essential \
        msitools \
        wine32 \
        wine \
        wixl \
        zip \
        unzip

FROM base_image
ENV PACKAGES_DIR=/tamanu/packages \
    DEPLOY_DIR=/tamanu/deploy \
    DESKTOP_RELEASE_DIR=/tamanu/packages/desktop/release \
    LAN_RELEASE_DIR=/tamanu/packages/lan/release \
    DESKTOP_ROOT=/tamanu/packages/desktop \
    LAN_ROOT=/tamanu/packages/lan \
    SYNC_SERVER_ROOT=/tamanu/packages/sync-server
COPY . .tmp/
WORKDIR /tamanu
