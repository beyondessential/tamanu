import { useMemo } from 'react';
import { NOUN_TYPES } from './constants';

export const useFilteredNouns = (allNouns, selectedNoun) =>
  useMemo(() => {
    if (!selectedNoun) {
      return allNouns;
    }

    if (selectedNoun.startsWith(NOUN_TYPES.OBJECT_ID + ':')) {
      const [, noun, ...objectIdParts] = selectedNoun.split(':');
      const objectId = objectIdParts.join(':');

      // Return the Object ID group with the child Object ID filtered to the selected Object ID
      return allNouns
        .filter(g => g.type === NOUN_TYPES.OBJECT_ID_GROUP && g.noun === noun)
        .map(g => ({
          ...g,
          data: { ...g.data, children: g.data.children.filter(c => c.objectId === objectId) },
        }))
        .filter(g => g.data.children.length > 0);
    }

    return allNouns.filter(g => g.noun === selectedNoun);
  }, [allNouns, selectedNoun]);
