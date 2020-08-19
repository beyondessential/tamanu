import { IPatient } from '~/types';
import { PatientSectionListItem } from '/interfaces/PatientSectionList';

export function groupEntriesByLetter(
  data: IPatient[],
): PatientSectionListItem[] {
  return data.reduce((acc: PatientSectionListItem[], cur: IPatient) => {
    if (acc.length === 0) {
      acc.push({
        header: cur.firstName[0].toUpperCase(),
        items: [cur],
      });
      return acc;
    }

    for (let index = 0; index < acc.length; index++) {
      if (acc[index].header === cur.firstName[0].toUpperCase()) {
        acc[index].items.push(cur);
        return acc;
      }
    }
    acc.push({
      header: cur.firstName[0].toUpperCase(),
      items: [cur],
    });
    return acc;
  }, []);
}
