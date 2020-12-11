export class PostgresWrapper {
  remove(filter) {} // uses a filter, will need to be updated
  insert(channel, syncRecord) {}
  countSince(channel, since) {}
  findSince(channel, since, { limit, offset }) {}
  markRecordDeleted(channel, id) {}
}
