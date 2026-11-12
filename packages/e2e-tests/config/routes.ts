export const routes = {
  login: '/',
  dashboard: '/dashboard',
  kiosk: '/kiosk',
  patients: {
    all: '/patients/all',
    emergency: '/patients/emergency',
    inpatients: '/patients/inpatient',
    patientDetails: '/patients/all/*',
    outpatients: '/patients/outpatient',
  },
  facilityAdmin: {
    recentlyDischargedPatients: '/facility-admin/recently-discharged-patients',
  },
};

export function wildcardToRegex(route: string): RegExp {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexString = escaped.replace('\\*', '[^/]+') + '$';
  return new RegExp(regexString);
}
