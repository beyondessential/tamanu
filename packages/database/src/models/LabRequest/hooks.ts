import {
  INVOICE_ITEMS_CATEGORIES,
  LAB_REQUEST_STATUSES,
  NOTIFICATION_TYPES,
  INVOICEABLE_LAB_REQUEST_STATUSES,
  INPATIENT_BUNDLED_CATEGORIES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import type { LabRequest } from './LabRequest';
import type { InstanceUpdateOptions } from 'sequelize';
import { isInpatientFeeBundled } from '../../utils/isInpatientFeeBundled';

// Whether a lab request is invoiceable on its own status/settings, independent of bundling.
// Drives removal on update: a request that is no longer invoiceable (e.g. cancelled) is removed.
const isInvoiceableLabRequest = async (labRequest: LabRequest) => {
  const invoicePendingLabRequests = await labRequest.sequelize.models.Setting.get(
    'features.invoicing.invoicePendingLabRequests',
  );

  if (
    invoicePendingLabRequests &&
    [LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED, LAB_REQUEST_STATUSES.RECEPTION_PENDING].includes(
      labRequest.status,
    )
  ) {
    return true; // reception_pending and sample-not-collected are auto invoiced if setting is enabled
  }

  return INVOICEABLE_LAB_REQUEST_STATUSES.includes(labRequest.status);
};

export const shouldAddLabRequestToInvoice = async (labRequest: LabRequest) => {
  const encounter = await labRequest.sequelize.models.Encounter.findByPk(labRequest.encounterId);
  if (!encounter) {
    return false;
  }

  // Skip auto-adding lab items for admission encounters where the facility bundles lab into the admission fee.
  if (
    await isInpatientFeeBundled(
      labRequest.sequelize.models,
      encounter,
      INPATIENT_BUNDLED_CATEGORIES.LAB,
    )
  ) {
    return false;
  }

  return isInvoiceableLabRequest(labRequest);
};

export const pushNotificationAfterUpdateHook = async (
  labRequest: LabRequest,
  options: InstanceUpdateOptions,
) => {
  const previousStatus = labRequest.previous('status');
  const currentStatus = labRequest.status;
  const isStatusChanging = currentStatus !== previousStatus;

  if (!isStatusChanging) return;

  // Cancelled/invalid requests: remove any existing lab-result notifications
  // so users don't see alerts for requests that no longer apply. Return early to not create new notifications.
  const shouldDeleteNotification = [
    LAB_REQUEST_STATUSES.DELETED,
    LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
  ].includes(currentStatus);

  if (shouldDeleteNotification) {
    await labRequest.sequelize.models.Notification.destroy({
      where: {
        metadata: {
          id: labRequest.id,
        },
      },
      transaction: options.transaction,
    });
    return;
  }

  // For all other status changes: create a notification when the request
  // reaches a "notify-worthy" status (interim, published, invalidated) or when
  // it was previously published (so we can notify about updates or withdrawal).
  const isChangingFromPublished = previousStatus === LAB_REQUEST_STATUSES.PUBLISHED;
  const NOTIFICATION_STATUSES = [
    LAB_REQUEST_STATUSES.INTERIM_RESULTS,
    LAB_REQUEST_STATUSES.PUBLISHED,
    LAB_REQUEST_STATUSES.INVALIDATED,
  ];

  const shouldPushNotification =
    NOTIFICATION_STATUSES.includes(currentStatus) || isChangingFromPublished;

  if (shouldPushNotification) {
    await labRequest.sequelize.models.Notification.pushNotification(
      NOTIFICATION_TYPES.LAB_REQUEST,
      { ...labRequest.dataValues, previousStatus },
      { transaction: options.transaction },
    );
  }
};

// The single source of truth for what a lab request bills: one item per panel request whose panel
// has a current product, plus one per individually-billable test type. All three lab invoicing
// hooks (this model, LabTest, LabTestPanelRequest) resolve through here so the coverage and dedup
// rules live in one place, and every run picks the same representative rows so the upsert stays
// idempotent and removal exact.
export const getInvoiceItemsForLabRequest = async (labRequest: LabRequest) => {
  const { InvoiceProduct, LabTestPanelRequest, LabTest } = labRequest.sequelize.models;
  const deterministicOrder: any = [
    ['createdAt', 'ASC'],
    ['id', 'ASC'],
  ];
  const items = [];

  // Each panel request whose panel has a current invoice product bills that product once; its
  // tests are then covered and not billed individually.
  const panelRequests = await LabTestPanelRequest.findAll({
    where: { labRequestId: labRequest.id },
    order: deterministicOrder,
  });
  const billedPanelRequestIds = new Set();
  for (const panelRequest of panelRequests) {
    const panelProduct = await InvoiceProduct.findOne({
      where: {
        category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_PANEL,
        sourceRecordId: panelRequest.labTestPanelId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
    });
    if (panelProduct) {
      items.push({ item: panelRequest, product: panelProduct });
      billedPanelRequestIds.add(panelRequest.id);
    }
  }

  const tests = await LabTest.findAll({
    where: { labRequestId: labRequest.id },
    order: deterministicOrder,
  });

  // A request migrated from the single-panel structure holds exactly one panel request and
  // unattributed tests; treat those tests as belonging to that panel so a historical request does
  // not bill its tests on top of the panel product.
  const inferredPanelRequestId =
    panelRequests.length === 1 && tests.every(test => !test.labTestPanelRequestId)
      ? panelRequests[0].id
      : null;

  // Individual (loose) tests, and tests whose panel does not bill, are charged against their test
  // type product once per request. A loose test of a type also covered by a product-bearing panel
  // still bills separately, since its row is not attributed to that panel request.
  const billedTestTypeIds = new Set();
  for (const test of tests) {
    const coveringPanelRequestId = test.labTestPanelRequestId ?? inferredPanelRequestId;
    if (coveringPanelRequestId && billedPanelRequestIds.has(coveringPanelRequestId)) {
      continue;
    }
    if (billedTestTypeIds.has(test.labTestTypeId)) {
      continue;
    }
    billedTestTypeIds.add(test.labTestTypeId);
    const testProduct = await InvoiceProduct.findOne({
      where: {
        category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE,
        sourceRecordId: test.labTestTypeId,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
    });
    if (testProduct) {
      items.push({ item: test, product: testProduct });
    }
  }

  return items;
};

export const addLabRequestToInvoice = async (labRequest: LabRequest) => {
  const encounterId = labRequest.encounterId;
  if (!encounterId) {
    return; // No encounter for procedure, so no invoice to add to
  }

  const products = await getInvoiceItemsForLabRequest(labRequest);
  await Promise.all(
    products.map(async ({ item, product }) =>
      labRequest.sequelize.models.Invoice.addItemToInvoice(
        item,
        encounterId,
        product,
        labRequest.requestedById,
      ),
    ),
  );
};

const removeFromInvoice = async (instance: LabRequest) => {
  const encounterId = instance.encounterId;
  if (!encounterId) {
    return; // No encounter for procedure, so no invoice to remove from
  }

  const items = await getInvoiceItemsForLabRequest(instance);
  await Promise.all(
    items.map(async ({ item }) =>
      instance.sequelize.models.Invoice.removeItemFromInvoice(item, encounterId),
    ),
  );
};

const addOrRemoveFromInvoiceAfterUpdateHook = async (instance: LabRequest) => {
  if (await shouldAddLabRequestToInvoice(instance)) {
    await addLabRequestToInvoice(instance);
  } else if (!(await isInvoiceableLabRequest(instance))) {
    // Only remove when the request itself is no longer invoiceable (e.g. cancelled). Bundling
    // suppresses auto-adding new items but must not retro-remove one already on the invoice
    // (e.g. added pre-admission before an admit-in-place), so a bundled item is left in place.
    await removeFromInvoice(instance);
  }
};

const removeFromInvoiceAfterDestroyHook = async (instance: LabRequest) => {
  await removeFromInvoice(instance);
};

export const afterCreateHook = async (instance: LabRequest) => {
  if (await shouldAddLabRequestToInvoice(instance)) {
    await addLabRequestToInvoice(instance);
  }
};

export const afterUpdateHook = async (labRequest: LabRequest, options: InstanceUpdateOptions) => {
  await Promise.all([
    pushNotificationAfterUpdateHook(labRequest, options),
    addOrRemoveFromInvoiceAfterUpdateHook(labRequest),
  ]);
};

export const afterDestroyHook = async (instance: LabRequest) => {
  await removeFromInvoiceAfterDestroyHook(instance);
};
