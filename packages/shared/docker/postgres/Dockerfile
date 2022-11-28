FROM postgres:12
COPY packages/shared-src/docker/postgres/init.sh /docker-entrypoint-initdb.d/init.sh
COPY packages/shared-src/docker/postgres/healthcheck.sh /usr/local/bin/
HEALTHCHECK --interval=2s --retries=100 --timeout=1s CMD ["/usr/local/bin/healthcheck.sh"]
