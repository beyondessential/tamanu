import config from 'config';

import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';
import {
  createSingleLabRequestNotification,
  createMultiLabRequestNotifications,
} from 'shared/tasks/CreateLabRequestNotifications';
import { sendCertificateNotifications } from '../tasks/SendCertificateNotifications';

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
      if (config.notifications.certificates.labTestCategoryId) {
        store.models.LabRequest.addHook(
          'afterBulkCreate', // Sync triggers bulk actions, even if it's only for one entry
          'create published test results notification hook',
          labRequests => {
            createMultiLabRequestNotifications(labRequests, store.models);
          },
        );
        store.models.LabRequest.addHook(
          'afterBulkUpdate',
          'create published test results notification hook',
          labRequest => {
            // Sync triggers a bulk action, but we filter the update by id so it's always for a single entry
            createSingleLabRequestNotification(labRequest.attributes, store.models);
          },
        );
      }
      // Send out queued certificate notifications
      store.models.CertificateNotification.addHook(
        'afterBulkCreate', // Sync triggers bulk actions, even if it's only for one entry
        'create certificate notification hook',
        certificateNotifications => {
          sendCertificateNotifications(certificateNotifications, store.models);
        },
      );
    }
  }
}
