FROM node:10-alpine

WORKDIR /app

# Install dependencies first as they dont change much
COPY package.json .
COPY yarn.lock .
COPY scripts/ ./scripts/

RUN yarn install

# Add the rest of the app
COPY . .
