/**
 * Assembles the legacy localisation shape from settings, so the login payload (and the
 * facility UserLocalisationCache fed from it) keeps its shape while the underlying values
 * move out of `config.localisation.data` into un-nested global settings.
 */
export const getLocalisation = async settings => {
  // One resolved read: parallel get()s would each rebuild the whole settings
  // cascade when the cache is cold (fresh boot, or just invalidated by a save).
  const all = await settings.getAll();
  return {
    units: all.units,
    country: all.country,
    imagingTypes: all.imagingTypes,
    disabledReports: all.reporting?.disabledReports,
    supportDeskUrl: all.supportDeskUrl,
  };
};
