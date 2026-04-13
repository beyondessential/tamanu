import { times } from 'lodash';
import { randomRecordId } from '@tamanu/database/demoData/utilities';
import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateLabRequestParams extends CommonParams {
  departmentId?: string;
  userId?: string;
  encounterId?: string;
  referenceDataId?: string;
  patientId?: string;
  labTestTypeId?: string;
  testCount?: number;
}
export const createLabRequest = async ({
  models,
  departmentId,
  userId,
  encounterId,
  referenceDataId,
  patientId,
  labTestTypeId,
  testCount = chance.integer({ min: 1, max: 10 }),
}: CreateLabRequestParams): Promise<void> => {
  const { LabRequest, LabRequestLog, LabTest, CertificateNotification } = models;

  const resolvedDepartmentId = departmentId || (await randomRecordId(models, 'Department'));
  const resolvedUserId = userId || (await randomRecordId(models, 'User'));
  const resolvedEncounterId = encounterId || (await randomRecordId(models, 'Encounter'));
  const resolvedRefDataId = referenceDataId || (await randomRecordId(models, 'ReferenceData'));
  const resolvedPatientId = patientId || (await randomRecordId(models, 'Patient'));
  const resolvedLabTestTypeId = labTestTypeId || (await randomRecordId(models, 'LabTestType'));

  const labRequest = await LabRequest.create(
    fake(LabRequest, {
      departmentId: resolvedDepartmentId,
      collectedById: resolvedUserId,
      encounter: resolvedEncounterId,
    }),
  );

  await LabRequestLog.create(
    fake(LabRequestLog, {
      status: 'reception_pending',
      labRequestId: labRequest.id,
    }),
  );

  for (const _ of times(testCount)) {
    const labTest = await LabTest.create(
      fake(LabTest, {
        labRequestId: labRequest.id,
        categoryId: resolvedRefDataId,
        labTestMethodId: resolvedRefDataId,
        labTestTypeId: resolvedLabTestTypeId,
      }),
    );
    await CertificateNotification.create(
      fake(CertificateNotification, {
        patientId: resolvedPatientId,
        labTestId: labTest.id,
        labRequestId: labRequest.id,
      }),
    );
  }
};
