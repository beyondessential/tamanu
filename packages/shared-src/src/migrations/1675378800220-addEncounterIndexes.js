export async function up(query) {
  await query.addIndex('encounters', {
    fields: ['start_date'],
  });
  await query.addIndex('encounters', {
    fields: ['end_date'],
  });
  await query.addIndex('encounters', {
    fields: ['encounter_type'],
  });
  await query.addIndex('encounters', {
    fields: ['location_id'],
  });

  await query.addIndex('note_pages', {
    fields: ['record_id'],
  });
  await query.addIndex('note_pages', {
    fields: ['date'],
  });
  await query.addIndex('note_items', {
    fields: ['note_page_id'],
  });

  await query.addIndex('survey_responses', {
    fields: ['survey_id'],
  });
  await query.addIndex('survey_response_answers', {
    fields: ['response_id'],
  });

  await query.addIndex('lab_tests', {
    fields: ['lab_request_id'],
  });
}

export async function down(query) {
  await query.removeIndex('encounters', 'encounters_start_date');
  await query.removeIndex('encounters', 'encounters_end_date');
  await query.removeIndex('encounters', 'encounters_encounter_type');
  await query.removeIndex('encounters', 'encounters_location_id');

  await query.removeIndex('note_pages', 'note_pages_record_id');
  await query.removeIndex('note_pages', 'note_pages_date');
  await query.removeIndex('note_items', 'note_items_note_page_id');

  await query.removeIndex('survey_responses', 'survey_responses_survey_id');
  await query.removeIndex('survey_response_answers', 'survey_response_answers_response_id');

  await query.removeIndex('lab_tests', 'lab_tests_lab_request_id');
}
