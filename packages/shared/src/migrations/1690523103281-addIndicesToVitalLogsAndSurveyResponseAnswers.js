export async function up(query) {
  await query.addIndex('vital_logs', {
    fields: ['answer_id'],
  });
  await query.addIndex('survey_response_answers', {
    fields: ['body'],
  });
}

export async function down(query) {
  await query.removeIndex('vital_logs', ['answer_id']);
  await query.removeIndex('survey_response_answers', ['body']);
}
