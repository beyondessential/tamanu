FROM node:20-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 make g++ git jq \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY patches/ patches/
COPY common.* ./
COPY scripts/ scripts/
COPY packages/ packages/

RUN npm ci
RUN npm run build-shared
RUN npm run --workspace=@tamanu/synthetic-tests merge-scenarios \
  && ls -la /app/packages/synthetic-tests/src/merged-*.yml 2>/dev/null || true

FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/node_modules/ node_modules/
COPY --from=build /app/packages/synthetic-tests/ packages/synthetic-tests/
COPY --from=build /app/package.json ./

COPY packages/synthetic-tests/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
