import { fake, fakeReferenceData } from '@tamanu/shared/test-helpers';
import { randomLabRequest } from '@tamanu/shared/demoData';
import { LAB_REQUEST_STATUSES, IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants';

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

export const fakeResourcesOfFhirServiceRequestWithLabRequest = async (models, resources) => {
  const { LabRequest, ReferenceData, LabTestPanel, LabTestPanelRequest } = models;
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
    patientId: resources.patient.id,
    encounterId: resources.encounter.id,
    status: LAB_REQUEST_STATUSES.PUBLISHED,
    labTestPanelRequestId: labTestPanelRequest.id, // make one of them part of a panel
    requestedDate: '2022-07-27 16:30:00',
  });

  const labRequest = await LabRequest.create(labRequestData);

  return { category, labTestPanel, labTestPanelRequest, labRequest };
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
