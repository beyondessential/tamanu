export function getUserInitials(username: string) {
  return `${username.split(' ')[0][0]}${username.split(' ')[1][0]}`;
}

export const Genders = {
  FEMALE: 'female',
  MALE: 'male',
  OTHER: 'other',
};
