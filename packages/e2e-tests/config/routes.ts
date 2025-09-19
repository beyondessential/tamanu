export const routes = {
  login: '/',
  dashboard: '/#/dashboard',
  patients: {
    all: '/#/patients/all',
    patientDetails: '/#/patients/all/*',
  },
  referenceData: '/#/admin/referenceData'
};

export function wildcardToRegex(route: string): RegExp {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexString = escaped.replace('\\*', '[^/]+') + '$';
  return new RegExp(regexString);
}
