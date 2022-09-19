import config from 'config';

import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';
import { fhirQueue } from '../tasks/FhirMaterialiser';
import { FHIR_RESOURCE_TYPES } from 'shared/constants';
import { log } from 'shared/services/logging';

export async function addHooks(store) {
  if (config.notifications) {
    if (config.notifications.referralCreated) {
      store.models.Referral.addHook(
        'afterCreate',
        'create referral notification hook',
        referral => {
          createReferralNotification(referral, store.models);
        },
      );
    }
  }

  if (config.integrations?.fhir) {
    const singleHooks = ['afterCreate', 'afterUpdate'];
    const bulkHooks = ['afterBulkCreate', 'afterBulkUpdate'];

    for (const resource of Object.values(FHIR_RESOURCE_TYPES)) {
      const Upstream = store.models[`Fhir${resource}`].UpstreamModel;
      if (!Upstream) continue;

      log.info(`Installing ${Upstream.name} hooks for FHIR materialisation`);

      for (const hook of singleHooks) {
        Upstream.addHook(hook, 'fhirMaterialisation', patient => {
          fhirQueue(resource, patient.id);
        });
      }

      for (const hook of bulkHooks) {
        Upstream.addHook(hook, 'fhirMaterialisation', patients => {
          patients.forEach(patient => fhirQueue(resource, patient.id));
        });
      }
    }
  }
}
