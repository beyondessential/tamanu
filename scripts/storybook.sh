#!/bin/bash
set -euo pipefail

echo "Verifying Storybook builds OK"

yarn workspace desktop run verify-storybook
