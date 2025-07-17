import { AllPatientsPage } from '../pages/patients/AllPatientsPage';
import { getItemFromLocalStorage, getCurrentUser } from './generateNewPatient';
import { constructFacilityUrl } from './navigation';
import { Locator } from '@playwright/test';

// Utility method to convert YYYY-MM-DD to MM/DD/YYYY format
export const convertDateFormat = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return '';
  
  let dateString: string;
  
  if (dateInput instanceof Date) {
    dateString = dateInput.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  } else {
    dateString = dateInput;
  }
  
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
      isPartialWorkflow: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to record patient death: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Utility method to handle search box suggestions
 * @param searchBox The search box locator
 * @param suggestionList The suggestion list locator
 * @param searchText The text to search for
 * @param timeout Optional timeout in milliseconds (default: 5000)
 * @throws Error if the suggestion is not found in the list
 */
export async function SelectingFromSearchBox(
  searchBox: Locator,
  suggestionList: Locator,
  searchText: string,
  timeout: number = 10000,
): Promise<void> {
  try {
    await searchBox.fill(searchText);
    await searchBox.waitFor({ state: 'visible', timeout });
    const suggestionOption = suggestionList.getByText(searchText);
    await suggestionOption.waitFor({ state: 'visible', timeout });
    await suggestionOption.click();
  } catch (error) {
    throw new Error(`Failed to handle search box suggestion: ${error.message}`);
  }
}

/**
 * Utility method to offset a date by one year
 * @param dateToOffset - The date to offset
 * @param offset - The offset to apply ('increaseByOneYear' or 'decreaseByOneYear')
 * @returns The date with the offset applied
 */
export async function offsetYear(
  dateToOffset: string,
  offset: 'increaseByOneYear' | 'decreaseByOneYear',
): Promise<string> {
  const [yearStr, month, day] = dateToOffset.split('-');
  let year = Number(yearStr);
  if (offset === 'increaseByOneYear') year++;
  else if (offset === 'decreaseByOneYear') year--;
  else throw new Error('Invalid offset');

  // Handle Feb 29 for non-leap years
  if (month === '02' && day === '29') {
    const isLeap = (y: number) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    if (!isLeap(year)) return `${year}-02-28`;
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
