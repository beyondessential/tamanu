import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

export async function checkConfig({ settings, models }) {
  const ensureSurveyDefaultExists = async (modelName, code) => {
    const found = await models[modelName].findOne({ where: { code } });
    if (!found) {
      log.error(`Default survey ${modelName} with code ${code} could not be found`);
    }
  };

  const { enabled, reportIds } = await settings.central.get('integrations.dhis2');
  const found = await models.ReportDefinition.findAll({ where: { id: reportIds } });
  if (enabled && found.length !== reportIds.length) {
    const missing = reportIds.filter(id => !found.some(r => r.id === id));
    log.error(`Reports ${missing} could not be found`);
  }

  const facilityIds = selectFacilityIds(config);
  for (const facilityId of facilityIds) {
    const { department, location } = await settings[facilityId].get('survey.defaultCodes');
    await Promise.all([
      ensureSurveyDefaultExists('Department', department),
      ensureSurveyDefaultExists('Location', location),
    ]);
  }
}
