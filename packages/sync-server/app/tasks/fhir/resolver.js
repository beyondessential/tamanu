export function resolver(_, { log, sequelize }) {
  log.debug('Running FHIR upstream resolver');
  return sequelize.query('CALL fhir.resolve_upstreams()');
}
