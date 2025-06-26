import { getRandomSuggesterOption } from './getRandomSuggesterOption';

export const getRandomLocation = async (baseUrl: string, token: string, facilityId: string) => {
  return getRandomSuggesterOption(baseUrl, token, facilityId, 'location');
};
