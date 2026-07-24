import { ReadSettings } from '@tamanu/settings';

import { createReferralNotification } from '@tamanu/shared/tasks/CreateReferralNotification';

export async function addHooks(store) {
  const settings = new ReadSettings(store.models);
  // Checked when a referral is created (not at boot, where the settings table may
  // not exist yet on a fresh install), so toggling the setting applies live.
  store.models.Referral.addHook('afterCreate', 'create referral notification hook', async referral => {
    if (await settings.get('notifications.referralCreated')) {
      // Deliberately not awaited: a notification failure must not fail the referral
      createReferralNotification(referral, store.models);
    }
  });
}
