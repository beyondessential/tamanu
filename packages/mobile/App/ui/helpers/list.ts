import { IPatient } from '~/types';
import { PatientSectionListItem } from '/interfaces/PatientSectionList';

function getGroupingLetter(patient: IPatient): string {
  return patient.lastName[0] || '';
}

export function groupEntriesByLetter(
  data: IPatient[],
): PatientSectionListItem[] {
  return data
    .reduce((acc: PatientSectionListItem[], cur: IPatient) => {
      const letter = getGroupingLetter(cur);
      if (acc.length === 0) {
        acc.push({
          header: letter.toUpperCase(),
          items: [cur],
        });
        return acc;
      }

      for (let index = 0; index < acc.length; index++) {
        if (acc[index].header === letter.toUpperCase()) {
          acc[index].items.push(cur);
          return acc;
        }
      }
      acc.push({
        header: letter.toUpperCase(),
        items: [cur],
      });
      return acc;
    }, []);
}
