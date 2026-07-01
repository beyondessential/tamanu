/**
 * Assembles the legacy localisation shape from settings, so the login payload (and the
 * facility UserLocalisationCache fed from it) keeps its shape while the underlying values
 * move out of `config.localisation.data` into un-nested global settings.
 */
export const getLocalisation = async settings => {
  const [units, country, imagingTypes, disabledReports, supportDeskUrl] = await Promise.all([
    settings.get('units'),
    settings.get('country'),
    settings.get('imagingTypes'),
    settings.get('disabledReports'),
    settings.get('supportDeskUrl'),
  ]);
  return { units, country, imagingTypes, disabledReports, supportDeskUrl };
};
