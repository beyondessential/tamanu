import { fake, fakeReferenceData } from '@tamanu/fake-data/fake';
import { randomLabRequest } from '@tamanu/database/demoData';
import {
  IMAGING_REQUEST_STATUS_TYPES,
  LAB_REQUEST_STATUSES,
  FHIR_REQUEST_PRIORITY,
} from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';

export const fakeResourcesOfFhirServiceRequest = async models => {
  const {
    Department,
    Encounter,
    Facility,
    ImagingAreaExternalCode,
    Location,
    LocationGroup,
    Patient,
    ReferenceData,
    User,
    FhirPatient,
  } = models;

  const [practitioner, patient, area1, area2, facility] = await Promise.all([
    User.create(fake(User)),
    Patient.create(fake(Patient)),
    ReferenceData.create({ ...fakeReferenceData('xRay'), type: 'xRayImagingArea' }),
    ReferenceData.create({ ...fakeReferenceData('xRay'), type: 'xRayImagingArea' }),
    Facility.create(fake(Facility)),
  ]);

  const [extCode1, extCode2, fhirPatient, locationGroup] = await Promise.all([
    ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area1.id })),
    ImagingAreaExternalCode.create(fake(ImagingAreaExternalCode, { areaId: area2.id })),
    FhirPatient.materialiseFromUpstream(patient.id),
    LocationGroup.create(fake(LocationGroup, { facilityId: facility.id })),
  ]);

  const location = await Location.create(
    fake(Location, { facilityId: facility.id, locationGroupId: locationGroup.id }),
  );
  const department = await Department.create(
    fake(Department, { locationId: location.id, facilityId: facility.id }),
  );

  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId: patient.id,
      locationId: location.id,
      departmentId: department.id,
      examinerId: practitioner.id,
      encounterType: 'admission',
    }),
  );

  const resources = {
    encounter,
    practitioner,
    patient,
    area1,
    area2,
    facility,
    location,
    department,
    extCode1,
    extCode2,
    fhirPatient,
    locationGroup,
  };

  return resources;
};

export const fakeResourcesOfFhirServiceRequestWithLabRequest = async (
  models,
  resources,
  isWithPanels = true,
  overrides = {},
) => {
  const {
    LabRequest,
    ReferenceData,
    LabTest,
    LabTestType,
    LabTestPanel,
    LabTestPanelRequest,
    LabTestPanelLabTestTypes,
  } = models;
  const category = await ReferenceData.create({
    ...fake(ReferenceData),
    type: 'labTestCategory',
  });
  const validFhirPriority = await ReferenceData.create({
    ...fakeReferenceData('URGENT'),
    type: 'labTestPriority',
    name: FHIR_REQUEST_PRIORITY.URGENT,
    code: 'URGENT',
  });
  const invalidFhirPriority = await ReferenceData.create({
    ...fakeReferenceData('NONSENSE'),
    type: 'labTestPriority',
    name: 'nonsense',
    code: 'NONSENSE',
  });

  const requestValues = {
    requestedById: resources.practitioner.id,
    patientId: resources.patient.id,
    encounterId: resources.encounter.id,
    status: LAB_REQUEST_STATUSES.PUBLISHED,
    labTestPriorityId: validFhirPriority.id,
    requestedDate: '2022-07-27 16:30:00',
    ...overrides,
  };
  let labRequest;
  let labRequestData;
  if (isWithPanels) {
    const labTestPanel = await LabTestPanel.create({
      ...fake(LabTestPanel),
      categoryId: category.id,
    });
    const testTypes = await fakeTestTypes(10, LabTestType, category.id);
    await Promise.all(
      testTypes.map(testType =>
        LabTestPanelLabTestTypes.create({
          labTestPanelId: labTestPanel.id,
          labTestTypeId: testType.id,
        }),
      ),
    );
    const labTestPanelRequest = await LabTestPanelRequest.create({
      ...fake(LabTestPanelRequest),
      labTestPanelId: labTestPanel.id,
      encounterId: resources.encounter.id,
    });
    requestValues.labTestPanelRequestId = labTestPanelRequest.id; // make one of them part of a panel

    labRequestData = await randomLabRequest(models, requestValues);
    labRequest = await LabRequest.create(labRequestData);
    await Promise.all(
      testTypes.map(testType =>
        LabTest.create({
          labRequestId: labRequest.id,
          labTestTypeId: testType.id,
        }),
      ),
    );

    return {
      category,
      labRequest,
      labTestPanelRequestId: labTestPanelRequest.id,
      labTestPanel,
      labTestPanelRequest,
      panelTestTypes: testTypes,
      priorities: {
        validFhirPriority,
        invalidFhirPriority,
      },
    };
  }
  labRequestData = await randomLabRequest(models, requestValues);
  labRequest = await LabRequest.create(labRequestData);
  const testTypes = await fakeTestTypes(10, LabTestType, category.id);
  await Promise.all(
    testTypes.map(testType =>
      LabTest.create({
        labRequestId: labRequest.id,
        labTestTypeId: testType.id,
      }),
    ),
  );

  return {
    category,
    labRequest,
    testTypes,
  };
};

export const fakeTestTypes = async function (numberOfTests, LabTestType, categoryId) {
  const testTypes = [];
  for (let testTypeIndex = 0; testTypeIndex < numberOfTests; testTypeIndex++) {
    const currentLabTest = await LabTestType.create({
      ...fake(LabTestType),
      labTestCategoryId: categoryId,
      externalCode: uuidv4(),
    });
    testTypes.push(currentLabTest);
  }
  return testTypes;
};

export const fakeResourcesOfFhirServiceRequestWithImagingRequest = async (models, resources) => {
  const { ImagingRequest } = models;

  const imagingRequest = await ImagingRequest.create(
    fake(ImagingRequest, {
      requestedById: resources.practitioner.id,
      encounterId: resources.encounter.id,
      locationGroupId: resources.locationGroup.id,
      status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
      priority: 'routine',
      requestedDate: '2022-03-04 15:30:00',
      imagingType: 'xRay',
    }),
  );

  await imagingRequest.setAreas([resources.area1.id, resources.area2.id]);
  return imagingRequest;
};

export const fakeResourcesOfFhirSpecimen = async (models, resources, overrides = {}) => {
  const { LabRequest, LabTestPanelRequest, LabTestPanel, ReferenceData } = models;
  const specimenType = await ReferenceData.create({
    ...fake(ReferenceData),
    type: 'specimenType',
  });
  const bodySiteRef = await ReferenceData.create({
    ...fake(ReferenceData),
    type: 'labSampleSite',
  });
  const category = await ReferenceData.create({
    ...fake(ReferenceData),
    type: 'labTestCategory',
  });
  const labTestPanel = await LabTestPanel.create({
    ...fake(LabTestPanel),
    categoryId: category.id,
  });
  const labTestPanelRequest = await LabTestPanelRequest.create({
    ...fake(LabTestPanelRequest),
    labTestPanelId: labTestPanel.id,
    encounterId: resources.encounter.id,
  });
  const labRequestData = await randomLabRequest(models, {
    requestedById: resources.practitioner.id,
    collectedById: resources.practitioner.id,
    patientId: resources.patient.id,
    encounterId: resources.encounter.id,
    status: LAB_REQUEST_STATUSES.PUBLISHED,
    specimenTypeId: specimenType.id,
    labSampleSiteId: bodySiteRef.id,
    requestedDate: '2022-07-27 16:30:00',
    sampleTime: '2022-07-27 15:05:00',
    specimenAttached: true,
    labTestPanelRequestId: labTestPanelRequest.id, // make one of them part of a panel
    ...overrides,
  });
  const labRequest = await LabRequest.create(labRequestData);
  return { labRequest, specimenType, bodySiteRef };
};
