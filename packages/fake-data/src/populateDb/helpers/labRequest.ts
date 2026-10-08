import { addHours, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import { LAB_REQUEST_STATUSES, LAB_TEST_RESULT_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import type { LabTestType } from '@tamanu/database';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { randomRecordId, randomReferenceDataId } from '../randomRecord.js';
import { fake, chance } from '../../fake/index.js';
import { QUALITATIVE_LAB_RESULTS } from '../../fake/names.js';
import type { CommonParams } from './common.js';

// Mostly within the reference range, with the odd abnormal result either side.
const fakeLabResult = ({ resultType, maleMin, maleMax }: LabTestType): string => {
  if (resultType !== LAB_TEST_RESULT_TYPES.NUMBER || maleMin == null || maleMax == null) {
    return chance.pickone(QUALITATIVE_LAB_RESULTS);
  }
  const spread = maleMax - maleMin;
  return chance
    .floating({ min: maleMin - spread * 0.2, max: maleMax + spread * 0.2, fixed: 1 })
    .toString();
};

const STATUSES_WITH_RESULTS = [
  LAB_REQUEST_STATUSES.INTERIM_RESULTS,
  LAB_REQUEST_STATUSES.TO_BE_VERIFIED,
  LAB_REQUEST_STATUSES.VERIFIED,
  LAB_REQUEST_STATUSES.PUBLISHED,
];

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
  const { LabRequest, LabRequestLog, LabTest, LabTestType, CertificateNotification } = models;

  const resolvedDepartmentId = departmentId || (await randomRecordId(models, 'Department'));
  const resolvedUserId = userId || (await randomRecordId(models, 'User'));
  const resolvedEncounterId = encounterId || (await randomRecordId(models, 'Encounter'));
  const resolvedMethodId =
    referenceDataId || (await randomReferenceDataId(models, REFERENCE_TYPES.LAB_TEST_METHOD));
  const resolvedPatientId = patientId || (await randomRecordId(models, 'Patient'));
  const primaryLabTestType = await LabTestType.findByPk(
    labTestTypeId || (await randomRecordId(models, 'LabTestType')),
  );
  // A request is for one category, and orders each test in it at most once.
  const categoryId = primaryLabTestType.labTestCategoryId;
  const otherLabTestTypes = await LabTestType.findAll({
    where: { labTestCategoryId: categoryId, id: { [Op.ne]: primaryLabTestType.id } },
  });
  const labTestTypes = [
    primaryLabTestType,
    ...chance.pickset(otherLabTestTypes, Math.min(testCount - 1, otherLabTestTypes.length)),
  ];

  const labRequest = await LabRequest.create(
    fake(LabRequest, {
      departmentId: resolvedDepartmentId,
      collectedById: resolvedUserId,
      requestedById: resolvedUserId,
      encounterId: resolvedEncounterId,
      labTestCategoryId: categoryId,
      labTestPriorityId: await randomReferenceDataId(models, REFERENCE_TYPES.LAB_TEST_PRIORITY),
      labTestLaboratoryId: await randomReferenceDataId(models, REFERENCE_TYPES.LAB_TEST_LABORATORY),
      specimenTypeId: await randomReferenceDataId(models, REFERENCE_TYPES.SPECIMEN_TYPE),
      labSampleSiteId: await randomReferenceDataId(models, REFERENCE_TYPES.LAB_SAMPLE_SITE),
    }),
  );

  await LabRequestLog.create(
    fake(LabRequestLog, {
      status: labRequest.status,
      labRequestId: labRequest.id,
      updatedById: resolvedUserId,
    }),
  );

  const hasResults = STATUSES_WITH_RESULTS.includes(labRequest.status);
  const completedDate =
    labRequest.publishedDate ??
    (hasResults && labRequest.sampleTime
      ? toDateTimeString(
          addHours(parseISO(labRequest.sampleTime), chance.integer({ min: 2, max: 48 })),
        )
      : null);

  for (const labTestType of labTestTypes) {
    await LabTest.create(
      fake(LabTest, {
        labRequestId: labRequest.id,
        categoryId,
        labTestMethodId: resolvedMethodId,
        labTestTypeId: labTestType.id,
        date: labRequest.requestedDate.slice(0, 10),
        completedDate,
        result: hasResults ? fakeLabResult(labTestType) : '',
      }),
    );
  }

  await CertificateNotification.create(
    fake(CertificateNotification, {
      patientId: resolvedPatientId,
      labRequestId: labRequest.id,
    }),
  );
};
