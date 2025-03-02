import type { Models } from '@tamanu/database';
import { times } from 'lodash';
const { fake, chance } = require('@tamanu/shared/test-helpers/fake');

interface CreateLabRequestParams {
  models: Models;
  departmentId: string;
  userId: string;
  encounterId: string;
  referenceDataId: string;
  patientId: string;
  labTestTypeId: string;
  testCount?: number;
}
export const createLabRequest = async ({
  models: { LabRequest, LabRequestLog, LabTest, CertificateNotification },
  departmentId,
  userId,
  encounterId,
  referenceDataId,
  patientId,
  labTestTypeId,
  testCount = chance.integer({ min: 1, max: 10 }),
}: CreateLabRequestParams): Promise<void> => {
  const labRequest = await LabRequest.create(
    fake(LabRequest, {
      departmentId,
      collectedById: userId,
      encounter: encounterId,
    }),
  );

  await LabRequestLog.create(
    fake(LabRequestLog, {
      status: 'reception_pending',
      labRequestId: labRequest.id,
    }),
  );

  times(testCount, async () => {
    const labTest = await LabTest.create(
      fake(LabTest, {
        labRequestId: labRequest.id,
        categoryId: referenceDataId,
        labTestMethodId: referenceDataId,
        labTestTypeId,
      }),
    );
    await CertificateNotification.create(
      fake(CertificateNotification, {
        patientId,
        labTestId: labTest.id,
        labRequestId: labRequest.id,
      }),
    );
  });
};
