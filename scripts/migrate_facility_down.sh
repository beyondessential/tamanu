#!/bin/bash
STEPS=${1:-"1"}
TAMANU_ARGS="migrate down ${STEPS}" yarn run lan-start-dev
