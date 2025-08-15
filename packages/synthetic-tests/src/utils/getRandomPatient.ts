/**
 * Retrieves a random patient from the backend API.
 *
 * @param baseUrl - Base URL of the facility server
 * @param token - Authentication token for API access
 * @param facilityId - Facility ID to filter patients by
 * @returns Promise that resolves to a randomly selected patient object
 *
 * @example
 * ```typescript
 * const randomPatient = await getRandomPatient(baseUrl, token, facilityId);
 * console.log('Selected patient:', randomPatient.id);
 * ```
 *
 * @throws {Error} When the API request fails or no patients are found
 */
export async function getRandomPatient(
  baseUrl: string,
  token: string,
  facilityId: string,
): Promise<any> {
  // Get a list of patients and pick a random one
  const response = await fetch(
    `${baseUrl}/api/patient?rowsPerPage=100&page=0&facilityId=${facilityId}&isAllPatientsListing=true`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    console.error('Failed to fetch patients', response.status, response.statusText);
    throw new Error(`Failed to fetch patients: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    console.error('No patients found in the system', data);
    throw new Error('No patients found in the system');
  }

  // Pick a random patient from the list
  const randomIndex = Math.floor(Math.random() * data.data.length);
  return data.data[randomIndex];
}
