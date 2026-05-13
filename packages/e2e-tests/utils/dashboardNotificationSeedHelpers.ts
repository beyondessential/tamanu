import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { constructFacilityUrl } from './navigation';
import { getItemFromLocalStorage } from './localStorage';
import { testData } from './testData';

/** Matches `LAB_REQUEST_STATUSES.PUBLISHED` — publishing triggers `Notification.pushNotification` for lab requests. */
export const LAB_REQUEST_STATUS_PUBLISHED = 'published';

/** Matches `IMAGING_REQUEST_STATUS_TYPES.COMPLETED` — matches imaging notification hook (results available). */
export const IMAGING_REQUEST_STATUS_COMPLETED = 'completed';

/** Matches `IMAGING_TYPES.CT_SCAN`; widely present in facility reference data. */
export const IMAGING_TYPE_CT_SCAN = 'ctScan';

/** Matches `NOTIFICATION_TYPES` values returned by `/api/notifications`. */
export const NOTIFICATION_TYPE_LAB_REQUEST = 'lab_request';
export const NOTIFICATION_TYPE_IMAGING_REQUEST = 'imaging_request';
const UI_IMAGING_REQUEST_ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateUiLikeImagingRequestDisplayId(): string {
  let output = '';
  for (let i = 0; i < 8; i++) {
    const idx = Math.floor(Math.random() * UI_IMAGING_REQUEST_ID_ALPHABET.length);
    output += UI_IMAGING_REQUEST_ID_ALPHABET[idx];
  }
  return output;
}

export async function fetchFirstLabTestTypeId(api: APIRequestContext, page: Page): Promise<string> {
  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const qs = new URLSearchParams({ facilityId, noLimit: 'true' });
  const res = await api.get(`${constructFacilityUrl('/api/suggestions/labTestType')}?${qs.toString()}`);
  if (!res.ok()) {
    throw new Error(`fetchFirstLabTestTypeId failed: ${res.status()} ${await res.text()}`);
  }
  const rows: unknown = await res.json();
  if (!Array.isArray(rows) || rows.length === 0 || !(rows[0] as { id?: string }).id) {
    throw new Error('No lab test types returned from /api/suggestions/labTestType');
  }
  return (rows[0] as { id: string }).id;
}

export async function createPublishedLabRequestViaApi(
  api: APIRequestContext,
  page: Page,
  params: { encounterId: string; requestedByUserId: string },
): Promise<{ labRequestId: string; labRequestDisplayId: string }> {
  const labTestTypeId = await fetchFirstLabTestTypeId(api, page);
  const res = await api.post(constructFacilityUrl('/api/labRequest'), {
    data: {
      encounterId: params.encounterId,
      departmentId: testData.departmentId,
      requestedById: params.requestedByUserId,
      labTestTypeIds: [labTestTypeId],
    },
  });
  if (!res.ok()) {
    throw new Error(`create lab request failed: ${res.status()} ${await res.text()}`);
  }
  const body: unknown = await res.json();
  const created = Array.isArray(body) ? body[0] : body;
  const labRequestId = (created as { id: string }).id;
  const labRequestDisplayId = (created as { displayId: string }).displayId;

  const putRes = await api.put(constructFacilityUrl(`/api/labRequest/${labRequestId}`), {
    data: {
      status: LAB_REQUEST_STATUS_PUBLISHED,
      userId: params.requestedByUserId,
    },
  });
  if (!putRes.ok()) {
    throw new Error(`publish lab request failed: ${putRes.status()} ${await putRes.text()}`);
  }
  return { labRequestId, labRequestDisplayId };
}

export async function createCompletedImagingRequestViaApi(
  api: APIRequestContext,
  params: { encounterId: string; requestedByUserId: string },
): Promise<{ imagingRequestId: string; imagingRequestDisplayId: string }> {
  const displayId = generateUiLikeImagingRequestDisplayId();
  const postRes = await api.post(constructFacilityUrl('/api/imagingRequest'), {
    data: {
      displayId,
      encounterId: params.encounterId,
      imagingType: IMAGING_TYPE_CT_SCAN,
      requestedById: params.requestedByUserId,
    },
  });
  if (!postRes.ok()) {
    throw new Error(`create imaging request failed: ${postRes.status()} ${await postRes.text()}`);
  }
  const created = (await postRes.json()) as { id: string; displayId: string };
  const imagingRequestId = created.id;
  const imagingRequestDisplayId = created.displayId;

  const putRes = await api.put(constructFacilityUrl(`/api/imagingRequest/${imagingRequestId}`), {
    data: { status: IMAGING_REQUEST_STATUS_COMPLETED },
  });
  if (!putRes.ok()) {
    throw new Error(`complete imaging request failed: ${putRes.status()} ${await putRes.text()}`);
  }
  return { imagingRequestId, imagingRequestDisplayId };
}

type NotificationRow = {
  type?: string;
  patient?: { displayId?: string };
  metadata?: { displayId?: string };
};

/**
 * Waits until `/api/notifications` returns an entry whose card copy uses this **request** display id
 * (`metadata.displayId` — lab/imaging request id shown in parentheses in the drawer, not patient NHN).
 */
export async function waitForNotificationForRequestDisplayId(
  api: APIRequestContext,
  page: Page,
  requestDisplayId: string,
  options?: { type?: typeof NOTIFICATION_TYPE_LAB_REQUEST | typeof NOTIFICATION_TYPE_IMAGING_REQUEST },
): Promise<void> {
  const facilityId = await getItemFromLocalStorage(page, 'facilityId');
  const qs = new URLSearchParams({ facilityId });

  await expect
    .poll(
      async () => {
        const res = await api.get(`${constructFacilityUrl('/api/notifications')}?${qs.toString()}`);
        if (!res.ok()) {
          return false;
        }
        const data = (await res.json()) as {
          unreadNotifications?: NotificationRow[];
          readNotifications?: NotificationRow[];
        };
        const all = [...(data.unreadNotifications ?? []), ...(data.readNotifications ?? [])];
        return all.some(
          n =>
            n.metadata?.displayId === requestDisplayId &&
            (!options?.type || n.type === options.type),
        );
      },
      {
        timeout: 90_000,
        intervals: [400, 1_000, 2_000, 3_000],
      },
    )
    .toBe(true);
}
