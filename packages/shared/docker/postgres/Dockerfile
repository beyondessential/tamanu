FROM postgres:14
COPY packages/shared/docker/postgres/init.sh /docker-entrypoint-initdb.d/init.sh
COPY packages/shared/docker/postgres/healthcheck.sh /usr/local/bin/
HEALTHCHECK --interval=2s --retries=100 --timeout=1s CMD ["/usr/local/bin/healthcheck.sh"]
