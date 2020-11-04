FROM node:10-alpine

WORKDIR /app

# Install dependancies first as they dont change much
COPY package.json .
COPY yarn.lock .

RUN yarn install --ignore-scripts

# Add the rest of it will be mounted as a volume to keep this image size down