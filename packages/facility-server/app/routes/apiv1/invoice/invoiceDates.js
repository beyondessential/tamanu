import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { buildEncounterPeriod, buildInvoiceSections } from '@tamanu/utils/invoice';

/**
 * The dates an invoice's items may carry, and the sections it is divided into.
 *
 * The period bounds every item's date, which is a general invoicing rule, so it is resolved
 * whatever the splitting setting says. Only the sections are behind it, and only they read the
 * encounter's changelog, so an ordinary invoice page load does not touch the largest table in the
 * deployment.
 */
export const buildInvoiceDates = async ({ models, settings, encounterId, items }) => {
  const encounter = await models.Encounter.findByPk(encounterId, {
    attributes: ['encounterType', 'startDate', 'endDate'],
  });
  if (!encounter) return { sections: null, encounterPeriod: null };

  // The invoice's dates are read and picked where the facility is, so they are resolved there
  // rather than in the timezone the datetimes are stored in.
  const timeZones = {
    primaryTimeZone: getPrimaryTimeZone(),
    facilityTimeZone: await settings?.get('facilityTimeZone'),
  };
  const encounterPeriod = buildEncounterPeriod({ encounter, ...timeZones });

  const splitByEncounterType = await settings?.get('features.invoicing.splitByEncounterType');
  if (!splitByEncounterType) return { sections: null, encounterPeriod };

  const configuredSections = await models.Invoice.listConfiguredInvoiceSections();
  if (configuredSections.length === 0) return { sections: null, encounterPeriod };

  return {
    sections: buildInvoiceSections({
      encounter,
      revisions: await models.Invoice.loadEncounterTypeRevisions(encounterId),
      configuredSections,
      itemSectionIds: items.map(item => item.invoiceSectionId),
      ...timeZones,
    }),
    encounterPeriod,
  };
};
