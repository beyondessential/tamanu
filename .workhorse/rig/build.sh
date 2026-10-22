#!/bin/sh
set -eu
cd "$RIG_SOURCE"
npm run build --workspace=@tamanu/web-frontend
npm run package-default-translations --workspace=@tamanu/upgrade
