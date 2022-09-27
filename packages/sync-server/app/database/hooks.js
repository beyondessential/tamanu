import config from 'config';

import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';
import { FHIR_RESOURCE_TYPES } from 'shared/constants';
import { log } from 'shared/services/logging';

import { fhirQueue } from '../tasks/FhirMaterialiser';

export async function addHooks(store) {
  if (config.notifications?.referralCreated) {
    store.models.Referral.addHook('afterCreate', 'create referral notification hook', referral => {
      createReferralNotification(referral, store.models);
    });
  }

  if (config.integrations?.fhir?.enabled) {
    const singleHooks = ['afterCreate', 'afterUpdate'];

    for (const resource of FHIR_RESOURCE_TYPES) {
      const Upstream = store.models[`Fhir${resource}`].UpstreamModel;
      if (!Upstream) continue;

      log.info(`Installing ${Upstream.name} hooks for FHIR materialisation`);

      for (const hook of singleHooks) {
        Upstream.addHook(hook, 'fhirMaterialisation', patient => {
          fhirQueue(resource, patient.id);
        });
      }

      Upstream.addHook('afterBulkCreate', 'fhirMaterialisation', patients => {
        patients.forEach(patient => fhirQueue(resource, patient.id));
      });

      Upstream.addHook('afterBulkUpdate', 'fhirMaterialisation', async ({ where }) => {
        (await Upstream.findAll({ where })).forEach(patient => fhirQueue(resource, patient.id));
      });
    }
  }
}
