#!/bin/bash
set -euxo pipefail

yarn workspace shared-src run build
