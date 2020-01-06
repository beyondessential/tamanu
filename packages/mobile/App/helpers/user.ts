export function getUserInitials(username: string): string {
  return `${username.split(' ')[0][0]}${username.split(' ')[1][0]}`;
}

export const Genders = {
  FEMALE: 'female',
  MALE: 'male',
  OTHER: 'other',
};

export function getGender(gender: string): string {
  const lowerCaseGender = gender.toLowerCase();
  if (lowerCaseGender === Genders.FEMALE) return 'Female';
  if (lowerCaseGender === Genders.MALE) return 'Male';
  return 'Other';
}
