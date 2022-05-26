FROM node:12

WORKDIR /app

# Install dependencies first as they dont change much
COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile

# Add the rest of the app
COPY . .
