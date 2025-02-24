import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateLabRequestDataParams {
  models: Models;
  departmentId: string;
  userId: string;
  encounterId: string;
  referenceDataId: string;
  patientId: string;
  labTestTypeId: string;
}
export const createLabRequestData = async ({
  models: { LabRequest, LabRequestLog, LabTest, CertificateNotification },
  departmentId,
  userId,
  encounterId,
  referenceDataId,
  patientId,
  labTestTypeId,
}: CreateLabRequestDataParams): Promise<void> => {
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
};
