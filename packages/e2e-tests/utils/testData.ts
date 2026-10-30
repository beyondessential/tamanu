import { noteContent } from './noteContent';

export const testData = {
  noteContent,
  village: "Dama",
  villageId: "village-Dama",
  department: "Cardiology",
  departmentId: "department-Cardiology-tamanu",
  encounterType: "admission",
  locationId: "location-EDBed1-tamanu",
  patientBillingTypeId: "patientType-Private",
  patientId: undefined,
  areaName: "Emergency Department",
  dietName:"Carbohydrate controlled",
  dietName2:"Citrus free",
  dietSearchResult1:"CarbControlled",
  dietSearchResult2:"Citrusfree",
  // Provisioned by .github/scripts/e2e-test-setup.sh and provisioning.local-example.json5
  practitionerUser: { email: 'practitioner@tamanu.io', password: 'practitioner' },
  receptionUser: { email: 'reception@tamanu.io', password: 'reception' },
};
