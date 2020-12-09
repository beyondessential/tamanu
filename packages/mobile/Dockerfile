FROM node:10-alpine

WORKDIR /app

# Install dependancies first as they dont change much
COPY package.json .
COPY yarn.lock .

RUN yarn install

# Add the rest of the app
COPY . .
