import { AllPatientsPage } from "../pages/patients/AllPatientsPage";
import { getItemFromLocalStorage, getCurrentUser } from "./generateNewPatient";
import { constructFacilityUrl } from "./navigation";

// Utility method to convert YYYY-MM-DD to MM/DD/YYYY format
export const convertDateFormat = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
};

export async function recordPatientDeathViaApi(allPatientsPage: AllPatientsPage) {
  const token = await getItemFromLocalStorage(allPatientsPage, 'apiToken');
  const userData = await getCurrentUser(token);
  const currentFacilityId = await getItemFromLocalStorage(allPatientsPage, 'facilityId');
  const patientData = allPatientsPage.getPatientData();

  // Verify patient exists first
  const verifyPatientUrl = constructFacilityUrl(`/api/patient/${patientData.id}`);
  console.log('Verifying patient at URL:', verifyPatientUrl);
  
  const verifyResponse = await fetch(verifyPatientUrl, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!verifyResponse.ok) {
    throw new Error(`Patient ${patientData.id} not found. Please ensure patient is created first.`);
  }

  const apiDeathUrl = constructFacilityUrl(`/api/patient/${patientData.id}/death`);
  console.log('Recording death at URL:', apiDeathUrl);
  
  const response = await fetch(apiDeathUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clinicianId: userData.id,
      facilityId: currentFacilityId,
      timeOfDeath: new Date().toISOString(),
      causeOfDeath: null,
      mannerOfDeath: 'Disease',
      outsideHealthFacility: false,
      isPartialWorkflow: true
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to record patient death: ${response.statusText}`);
  }

  return response.json();
}