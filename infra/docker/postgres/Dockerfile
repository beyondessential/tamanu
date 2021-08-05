FROM postgres:12
COPY infra/docker/postgres/init.sh /docker-entrypoint-initdb.d/init.sh
COPY infra/docker/postgres/healthcheck.sh /usr/local/bin/
HEALTHCHECK CMD ["healthcheck.sh"]
