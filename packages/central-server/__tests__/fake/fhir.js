import { fake, fakeReferenceData } from '@tamanu/shared/test-helpers';
import { randomLabRequest } from '@tamanu/shared/demoData';
import { IMAGING_REQUEST_STATUS_TYPES, LAB_REQUEST_STATUSES } from '@tamanu/constants';

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

  const requestValues = {
    requestedById: resources.practitioner.id,
    patientId: resources.patient.id,
    encounterId: resources.encounter.id,
    status: LAB_REQUEST_STATUSES.PUBLISHED,
    requestedDate: '2022-07-27 16:30:00',
  };
  let labRequest;
  let labRequestData;
  if (isWithPanels) {
    const labTestPanel = await LabTestPanel.create({
      ...fake(LabTestPanel),
      categoryId: category.id,
    });
    const testTypes = await fakeTestTypes(10, LabTestType, category.id);
    await Promise.all(testTypes.map(testType => LabTestPanelLabTestTypes
      .create({
        labTestPanelId: labTestPanel.id,
        labTestTypeId: testType.id,
      })));
    const labTestPanelRequest = await LabTestPanelRequest.create({
      ...fake(LabTestPanelRequest),
      labTestPanelId: labTestPanel.id,
      encounterId: resources.encounter.id,
    });
    requestValues.labTestPanelRequestId = labTestPanelRequest.id; // make one of them part of a panel

    labRequestData = await randomLabRequest(models, requestValues);
    labRequest = await LabRequest.create(labRequestData);

    return {
      category,
      labRequest,
      labTestPanelRequestId: labTestPanelRequest.id,
      labTestPanel,
      labTestPanelRequest,
      panelTestTypes: testTypes,
    };
  }
  labRequestData = await randomLabRequest(models, requestValues);
  labRequest  = await LabRequest.create(labRequestData);
  const testTypes = await fakeTestTypes(10, LabTestType, category.id);
  await Promise.all(testTypes.map(testType => LabTest
    .create({
      labRequestId: labRequest.id,
      labTestTypeId: testType.id,
    })));

  return {
    category,
    labRequest,
    testTypes,
  };
};

export const fakeTestTypes = async function(numberOfTests, LabTestType, categoryId) {
  const testTypes = [];
  for (let testTypeIndex = 0; testTypeIndex < numberOfTests; testTypeIndex++) {
    const currentLabTest = await LabTestType.create({
      ...fake(LabTestType),
      labTestCategoryId: categoryId,
    });
    testTypes.push(currentLabTest);
  }
  return testTypes;
}


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
