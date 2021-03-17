export function getUserInitials(username: string): string {
  return `${username.split(' ')[0][0]}${username.split(' ')[1][0]}`;
}

interface NameProps {
  firstName: string;
  lastName: string;
}

export const joinNames = (data: NameProps): string => [data.firstName, data.lastName].join(' ');

export const Genders = {
  FEMALE: 'female',
  MALE: 'male',
  OTHER: 'other',
};

export function getGender(gender: string): string {
  if (!gender) return 'Error';
  const lowerCaseGender = gender.toLowerCase();
  if (lowerCaseGender === Genders.FEMALE) return 'Female';
  if (lowerCaseGender === Genders.MALE) return 'Male';
  return 'Other';
}
