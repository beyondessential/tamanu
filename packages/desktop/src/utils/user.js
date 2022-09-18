/**
 * @param username string
 * @returns {string}
 */
export function getUserInitials(username) {
  const [firstName, ...restOfNames] = username.split(' ');
  const lastName = restOfNames.length > 0 && restOfNames[restOfNames.length - 1];
  return `${firstName[0]}${lastName ? lastName[0] : ''}`;
}

/**
 * @param data {{ firstName: string, lastName: string }}
 * @returns {string}
 */
export const joinNames = data => [data.firstName, data.lastName].join(' ');

export const Genders = {
  FEMALE: 'female',
  MALE: 'male',
  OTHER: 'other',
};

/**
 * @param gender string
 * @return {string}
 */
export function getGender(gender) {
  if (!gender) return 'Error';
  const lowerCaseGender = gender.toLowerCase();
  if (lowerCaseGender === Genders.FEMALE) return 'Female';
  if (lowerCaseGender === Genders.MALE) return 'Male';
  return 'Other';
}
