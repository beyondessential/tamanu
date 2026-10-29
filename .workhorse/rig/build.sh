#!/bin/sh
set -eu
. "$RIG_RECIPE_DIR/lib.sh"
cd "$RIG_SOURCE"
npm run build --workspace=@tamanu/web-frontend
npm run package-default-translations --workspace=@tamanu/upgrade
