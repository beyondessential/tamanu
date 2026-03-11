import { useMemo } from 'react';

export const useFilteredNouns = (allNouns, selectedNoun) =>
  useMemo(() => {
    if (!selectedNoun) {
      return allNouns;
    }

    if (selectedNoun.startsWith('child:')) {
      const [, noun, ...objectIdParts] = selectedNoun.split(':');
      const objectId = objectIdParts.join(':');
      return allNouns
        .filter(g => g.type === 'objectId' && g.noun === noun)
        .map(g => ({
          ...g,
          data: { ...g.data, children: g.data.children.filter(c => c.objectId === objectId) },
        }))
        .filter(g => g.data.children.length > 0);
    }

    if (selectedNoun.startsWith('objectId:')) {
      const noun = selectedNoun.replace('objectId:', '');
      return allNouns.filter(g => g.type === 'objectId' && g.noun === noun);
    }

    return allNouns.filter(g => g.noun === selectedNoun);
  }, [allNouns, selectedNoun]);
