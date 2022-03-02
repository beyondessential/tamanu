import { genPatientSectionList } from '/components/PatientSectionList/fixture';

const data = genPatientSectionList();
data.sort((a, b) => {
  const aName = `${a.firstName} ${a.middleName} ${a.lastName}`.toLowerCase();
  const bName = `${b.firstName} ${b.middleName} ${b.lastName}`.toLowerCase();
  if (aName > bName) {
    return 1;
  } else if (aName < bName) {
    return -1;
  }
  return 0;
});

export const searchData = data;
