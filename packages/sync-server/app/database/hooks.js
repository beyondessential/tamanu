import config from 'config';

import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';
import {
  createLabRequestUpdateNotification,
  createLabRequestCreateNotification,
} from 'shared/tasks/CreateLabRequestNotifications';

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
    if (config.notifications.certificates) {
      // Create certificate notifications for published results
      if (config.notifications.certificates.labTestCategoryIds) {
        store.models.LabRequest.addHook(
          'afterBulkCreate', // Sync trigger bulk create action, even if it's only for one entry
          'create published test results notification hook',
          labRequests => {
            createLabRequestCreateNotification(labRequests, store.models);
          },
        );
        store.models.LabRequest.addHook(
          'afterUpdate',
          'create published test results notification hook',
          labRequest => {
            createLabRequestUpdateNotification(labRequest, store.models);
          },
        );
      }
    }
  }
}
