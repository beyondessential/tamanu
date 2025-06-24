export const getRandomSuggesterOption = async (
  baseUrl: string,
  token: string,
  facilityId: string,
  type: 'location' | 'department',
) => {
  const response = await fetch(
    `${baseUrl}/api/suggestions/${type}/all?facilityId=${facilityId}&filterByFacility=true`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    console.log('Failed to fetch suggester options', response);
    throw new Error(`Failed to fetch suggester options: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    console.log(`No ${type} options found in the system`, data);
    throw new Error(`No ${type} options found in the system`);
  }

  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex];
};
