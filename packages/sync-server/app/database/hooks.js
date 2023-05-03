import config from 'config';

import { createReferralNotification } from '@tamanu/shared/tasks/CreateReferralNotification.js';

export async function addHooks(store) {
  if (config.notifications?.referralCreated) {
    store.models.Referral.addHook('afterCreate', 'create referral notification hook', referral => {
      createReferralNotification(referral, store.models);
    });
  }
}
