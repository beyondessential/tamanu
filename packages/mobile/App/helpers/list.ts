import { PatientModel } from '/models/Patient';
import { PatientSectionListItem } from '../interfaces/PatientSectionList';

export function groupEntriesByLetter(
  data: PatientModel[],
): PatientSectionListItem[] {
  return data.reduce((acc: PatientSectionListItem[], cur: PatientModel) => {
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
