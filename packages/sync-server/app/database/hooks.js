import config from 'config';

import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';
import { FHIR_UPSTREAMS } from 'shared/constants';
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

    for (const [resource, upstreams] of Object.entries(FHIR_UPSTREAMS)) {
      for (const upstream of upstreams) {
        const Upstream = store.models[upstream];
        if (!Upstream) continue;

        log.info(`Installing ${upstream} hooks for FHIR materialisation of ${resource}`);

        for (const hook of singleHooks) {
          Upstream.addHook(hook, 'fhirMaterialisation', row => {
            fhirQueue(resource, row.id);
          });
        }

        Upstream.addHook('afterBulkCreate', 'fhirMaterialisation', rows => {
          rows.forEach(row => fhirQueue(resource, row.id));
        });

        Upstream.addHook('afterBulkUpdate', 'fhirMaterialisation', async ({ where }) => {
          (await Upstream.findAll({ where })).forEach(row => fhirQueue(resource, row.id));
        });
      }
    }
  }
}
