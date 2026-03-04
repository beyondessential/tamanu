export const routes = {
  login: '/',
  dashboard: '/dashboard',
  patients: {
    all: '/patients/all',
    inpatients: '/patients/inpatient',
    patientDetails: '/patients/all/*',
    outpatients: '/patients/outpatient',
  },
};

export function wildcardToRegex(route: string): RegExp {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexString = escaped.replace('\\*', '[^/]+') + '$';
  return new RegExp(regexString);
}
