import { getRandomSuggesterOption } from './getRandomSuggesterOption';

export const getRandomDepartment = async (baseUrl: string, token: string, facilityId: string) => {
  return getRandomSuggesterOption(baseUrl, token, facilityId, 'department');
};
