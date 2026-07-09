#!/bin/bash

### Reduce a Tamanu workspace to a single deployable package (server or frontend).
###
### Runs both in the production Docker build (see /Dockerfile) and, unchanged,
### on the Windows VHDX runner under Git Bash. Docker-only behaviour — the npm
### cache carried between build stages under /app, and self-deleting the script —
### is gated behind DOCKER_BUILD=1, which the Dockerfile sets. Helper scripts are
### invoked via `node`/`bash` rather than by relying on the executable bit +
### shebang, which is not honoured the same way on Windows.

set -euxo pipefail
shopt -s extglob

common() {
  # let build-tooling be installed in production mode
  cp package.json{,.working}
  jq '.dependencies["@tamanu/build-tooling"] = "*"' package.json.working > package.json
  rm package.json.working

  # in Docker, keep the cache in packages/ so it's carried between stages
  if [[ "${DOCKER_BUILD:-}" == "1" ]]; then
    npm config set cache /app/packages/.npm
  fi

  # install dependencies. Force bash as the lifecycle script shell so the
  # shell-syntax `prepare` hook (patch-package) parses on Windows, where npm
  # defaults to cmd.exe. bash is present in the Docker build image and Git Bash.
  npm install --no-interactive --package-lock --script-shell bash
}

remove_irrelevant_packages() {
  # remove from the npm workspace list every package that isn't the one we're building
  cp package.json{,.working}
  node scripts/list-packages.mjs -- --no-shared -- --paths \
    | tee debug.json \
    | jq \
      --arg wanted "$1" \
      '(. - ["packages/\($wanted)"])' \
    > /tmp/unwanted.json || true
    if [[ ! -s /tmp/unwanted.json ]]; then
      stat debug.json || true
      cat debug.json || true
      exit 1
    fi

  # erase from the package.json. --slurpfile wraps the file's array in an extra
  # array, so subtract [0] to actually trim the workspace entries (otherwise the
  # removed packages' deps survive a later prune).
  jq \
    --slurpfile unwanted /tmp/unwanted.json \
    '.workspaces.packages -= $unwanted[0]' \
    package.json.working > package.json.new
  # erase from the filesystem
  rm -rf $(jq -r '.[]' /tmp/unwanted.json)
  rm -rf packages/.new-package

  mv package.json.new package.json
  rm package.json.working
}

build_server() {
  # clear out the tests and files not useful for production
  rm -rf packages/*/__tests__ || true
  rm -rf packages/*/jest.* || true
  rm -rf packages/*/docker || true
  rm -rf packages/*/coverage || true
  rm -rf packages/*/config/{local,development,test}.* || true

  # Servers run from TypeScript source via the tsx loader; the one artefact the runtime
  # needs is the bundled default translations the upgrade step reads. Generate it while
  # every package is present (it scans the whole workspace for translatable strings).
  npm run package-default-translations --workspace @tamanu/upgrade

  remove_irrelevant_packages "$package"

  # clear out the build-tooling
  rm -rf node_modules/@tamanu/build-tooling
  rm -rf packages/build-tooling
  rm -rf packages/**/node_modules/@tamanu/build-tooling

  # clear out the build configs
  rm -rf packages/*/*.config.* || true

  # remove build-tooling from top package.json
  cp package.json{,.working}
  jq '.dependencies |= del(."@tamanu/build-tooling") | .workspaces.packages -= ["packages/build-tooling"]' \
    package.json.working > package.json
  rm package.json.working

  # remove build dependencies, then prune to a production dependency set
  npm install --no-interactive --package-lock --script-shell bash
  npm prune --omit=dev

  # cleanup
  npm cache clean --force
  rm -rf packages/.npm || true
  if [[ "${DOCKER_BUILD:-}" == "1" ]]; then rm "$0"; fi
}

build_web() {
  npm run build --workspace=@tamanu/web-frontend
  bash scripts/precompress-assets.sh packages/web/dist
}

build_patient_portal() {
  npm run build --workspace=@tamanu/patient-portal
  bash scripts/precompress-assets.sh packages/patient-portal/dist
}

package="${1:?Expected target or package path}"

common

case "$package" in
  web)
    build_web
    ;;
  patient-portal)
    build_patient_portal
    ;;
  *)
    build_server
    ;;
esac
