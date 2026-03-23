import { useMemo } from 'react';

import { HIDDEN_PERMISSION_NOUNS, PERMISSION_SCHEMA } from '@tamanu/constants';
import { NOUN_TYPES } from './constants';

const BASE_NOUN_OPTIONS = Object.keys(PERMISSION_SCHEMA)
  .filter(n => !HIDDEN_PERMISSION_NOUNS.has(n))
  .sort()
  .map(noun => ({ value: noun, label: noun }));

/**
 * Builds the noun options for the Autocomplete Field to filter the nouns
 */
export const useNounOptions = (permissions, objectNames) =>
  useMemo(() => {
    const childEntries = [];
    const seenKeys = new Set();
    for (const permission of permissions) {
      if (permission.objectId) {
        const key = `${permission.noun}#${permission.objectId}`;
        // Multiple permissions can share the same noun + objectId combination:
        // one for each verb (e.g. read Survey#survey-123, write Survey#survey-123, list Survey#survey-123).
        // Without seenKeys, the loop would push a duplicate dropdown entry
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const displayName = objectNames[key] ?? permission.objectId;
          childEntries.push({
            // This is going to be used for Autocomplete Field
            // When a value is selected, the only thing being passed is the value
            // So we need to prefix 'objectId' so that the selected value can be differentiated between regular nouns and object IDs
            value: `${NOUN_TYPES.OBJECT_ID}:${permission.noun}:${permission.objectId}`,
            label: `${permission.noun} — ${displayName}`,
          });
        }
      }
    }
    const childOptions = childEntries.sort((a, b) => a.label.localeCompare(b.label));
    return [...BASE_NOUN_OPTIONS, ...childOptions].sort((a, b) => a.label.localeCompare(b.label));
  }, [permissions, objectNames]);
