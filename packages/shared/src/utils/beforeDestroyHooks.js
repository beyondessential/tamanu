import { Op } from 'sequelize';

export async function beforeDestroyEncounter(encounter) {
  // Sequelize is going to work on cascade for paranoid table in the future.
  // There is an open issue for this: https://github.com/sequelize/sequelize/issues/2586
  // TODO: update this list as its incomplete
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

async function getEncounterIds(options) {
  const ids = options.where?.id?.[Op.in];

  // options.where.attribute.val.col
  // .logic[Op.LIKE]
  if (ids) {
    return ids;
  }

  const encounters = await options.model.findAll(options);
  return encounters.map(x => x.id);
}

export async function beforeBulkDestroyEncounter(options) {
  const ids = await getEncounterIds(options);
  // Bulk delete all other models - Should we actually apply this to individual delete, too?
  const {
    Discharge,
    Invoice,
    SurveyResponse,
    Referral,
    AdministeredVaccine,
    EncounterDiagnosis,
    EncounterMedication,
    LabRequest,
    ImagingRequest,
    Procedure,
    Vitals,
    Triage,
    LabTestPanelRequest,
    DocumentMetadata,
    EncounterHistory,
    Note,
  } = options.model.sequelize.models;

  await Discharge.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await Invoice.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await SurveyResponse.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await Referral.destroy({ where: { initiatingEncounterId: { [Op.in]: ids } } });
  await Referral.destroy({ where: { completingEncounterId: { [Op.in]: ids } } });
  await AdministeredVaccine.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await EncounterDiagnosis.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await EncounterMedication.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await LabRequest.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await ImagingRequest.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await Procedure.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await Vitals.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await Triage.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await LabTestPanelRequest.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await DocumentMetadata.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await EncounterHistory.destroy({ where: { encounterId: { [Op.in]: ids } } });
  await Note.destroy({ where: { recordType: options.model.name, recordId: { [Op.in]: ids } } });
}
