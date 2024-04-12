export async function beforeDestroyEncounter(encounter) {
  // Sequelize is going to work on cascade for paranoid table in the future.
  // There is an open issue for this: https://github.com/sequelize/sequelize/issues/2586
  const [
    vitals,
    notes,
    procedures,
    labRequests,
    imagingRequests,
    medications,
    surveyResponses,
    documents,
    invoices,
    initiatedReferrals,
    completedReferrals,
    encounterHistories,
  ] = await Promise.all([
    encounter.getVitals(),
    encounter.getNotes(),
    encounter.getProcedures(),
    encounter.getLabRequests(),
    encounter.getImagingRequests(),
    encounter.getMedications(),
    encounter.getSurveyResponses(),
    encounter.getDocuments(),
    encounter.getInvoice(),
    encounter.getInitiatedReferrals(),
    encounter.getCompletedReferrals(),
    encounter.getEncounterHistories(),
  ]);

  await Promise.all(
    [
      vitals,
      notes,
      procedures,
      labRequests,
      imagingRequests,
      medications,
      surveyResponses,
      documents,
      invoices,
      initiatedReferrals,
      completedReferrals,
      encounterHistories,
    ].map(async records => {
      if (records && Array.isArray(records)) {
        await Promise.all(records.map(record => record.destroy()));
      }
    }),
  );
}
