FROM postgres:12
COPY packages/shared-src/docker/postgres/init.sh /docker-entrypoint-initdb.d/init.sh
COPY packages/shared-src/docker/postgres/healthcheck.sh /usr/local/bin/
HEALTHCHECK CMD ["healthcheck.sh"]
