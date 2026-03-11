import { useMemo } from 'react';

import { HIDDEN_PERMISSION_NOUNS, PERMISSION_SCHEMA } from '@tamanu/constants';

const BASE_NOUN_OPTIONS = Object.keys(PERMISSION_SCHEMA)
  .filter(n => !HIDDEN_PERMISSION_NOUNS.has(n))
  .sort()
  .map(noun => ({ value: noun, label: noun }));

export const useNounOptions = (permissions, objectNames) =>
  useMemo(() => {
    const objectIdGroupNouns = new Set();
    const childEntries = [];
    const seenKeys = new Set();
    for (const perm of permissions) {
      if (perm.objectId) {
        objectIdGroupNouns.add(perm.noun);
        const key = `${perm.noun}#${perm.objectId}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const displayName = objectNames[key] ?? perm.objectId;
          childEntries.push({
            key,
            value: `child:${perm.noun}:${perm.objectId}`,
            label: `${perm.noun} — ${displayName}`,
          });
        }
      }
    }
    const groupOptions = [...objectIdGroupNouns]
      .sort()
      .map(noun => ({ value: `objectId:${noun}`, label: `${noun} (objectID)` }));
    const childOptions = childEntries
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(({ value, label }) => ({ value, label }));
    return [...BASE_NOUN_OPTIONS, ...groupOptions, ...childOptions].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [permissions, objectNames]);
