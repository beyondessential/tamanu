import { PatientTileProps } from '../components/PatientTile';
import { PatientSectionListItem } from '../interfaces/PatientSectionList';

export function groupEntriesByLetter(data: PatientTileProps[]) {
  return data.reduce((acc: PatientSectionListItem[], cur: PatientTileProps) => {
    if (acc.length === 0) {
      acc.push({
        header: cur.name[0].toUpperCase(),
        items: [cur],
      });
      return acc;
    }

    for (let index = 0; index < acc.length; index++) {
      if (acc[index].header === cur.name[0].toUpperCase()) {
        acc[index].items.push(cur);
        return acc;
      }
    }
    acc.push({
      header: cur.name[0].toUpperCase(),
      items: [cur],
    });
    return acc;
  }, []);
}
