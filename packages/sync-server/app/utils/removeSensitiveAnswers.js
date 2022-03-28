const filterFromSurveyResponseAnswer = (records, responseIds) => {
  return records.filter(record => {
    // Answer belongs to sensitive survey
    if (responseIds.includes(record.data.responseId)) {
      return false;
    }
    // Record isn't sensitive
    return true;
  });
};

const filterFromEncounter = (records, responseIds) => {
  return records.map(record => ({
    ...record,
    data: {
      ...record.data,
      // Only overwrite record.data.surveyResponses
      surveyResponses: record.data.surveyResponses.map(response => {
        // Response should not contain answers
        if (responseIds.includes(response.data.id)) {
          // Overwrite only response.data.answers
          return {
            ...response,
            data: { ...response.data, answers: [] },
          };
        }

        // Don't filter response
        return response;
      }),
    },
  }));
};

// This will return a new array after filtering all SurveyResponseAnswers
export const removeSensitiveAnswers = async (channel, models, records) => {
  // Find all SurveyResponse from sensitive surveys
  const sensitiveResponses = await models.SurveyResponse.findAll({
    attributes: ['id'],
    include: [{ association: 'survey', attributes: ['id'], where: { isSensitive: true } }],
  });

  // Get array of SurveyResponse IDs
  const responseIds = sensitiveResponses.map(response => response.id);

  // Check which of the two channels is being accessed
  if (channel === 'surveyResponseAnswer') {
    return filterFromSurveyResponseAnswer(records, responseIds);
  }

  return filterFromEncounter(records, responseIds);
};
