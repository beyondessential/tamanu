import { useMemo, useCallback } from 'react';

import { VERB_ABBREVIATIONS, VERB_DISPLAY_ORDER, VERB_HIERARCHY } from '@tamanu/constants';

export function getImpliedVerbs(verb) {
  const idx = VERB_HIERARCHY.indexOf(verb);
  if (idx < 0 || idx >= VERB_HIERARCHY.length - 1) return [];
  return VERB_HIERARCHY.slice(idx + 1);
}

export function getVerbAbbreviation(verb) {
  return VERB_ABBREVIATIONS[verb] ?? verb.charAt(0).toUpperCase();
}

export const usePermissionToggles = (nounGroup, onToggle) => {
  const isChecked = useCallback(
    (verb, roleId) => Boolean(nounGroup.verbs.find(v => v.verb === verb)?.roles[roleId]),
    [nounGroup.verbs],
  );

  const availableVerbs = useMemo(
    () => new Set(nounGroup.verbs.map(v => v.verb)),
    [nounGroup.verbs],
  );

  const handleToggle = useCallback(
    (verb, role) => {
      const currentValue = isChecked(verb, role.id);
      const toggles = [
        {
          verb,
          noun: nounGroup.noun,
          objectId: nounGroup.objectId,
          roleId: role.id,
          currentlyHasPermission: currentValue,
        },
      ];

      if (!currentValue) {
        for (const implied of getImpliedVerbs(verb)) {
          if (availableVerbs.has(implied) && !isChecked(implied, role.id)) {
            toggles.push({
              verb: implied,
              noun: nounGroup.noun,
              objectId: nounGroup.objectId,
              roleId: role.id,
              currentlyHasPermission: false,
            });
          }
        }
      }

      onToggle(toggles);
    },
    [nounGroup.noun, nounGroup.objectId, isChecked, availableVerbs, onToggle],
  );

  // Use a consistent verb order across all nouns so columns align, eg:
  // Row 1: L R W C
  // Row 2: L   W C
  // Row 3:       C
  const getSummary = useCallback(
    roleId =>
      VERB_DISPLAY_ORDER
        .map(verb => (isChecked(verb, roleId) ? getVerbAbbreviation(verb) : '\u00A0'))
        .join(' '),
    [isChecked],
  );

  return { isChecked, handleToggle, getSummary };
};
