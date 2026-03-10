import { useMemo, useCallback } from 'react';

import { VERB_HIERARCHY } from '@tamanu/constants';

import { getImpliedVerbs, getVerbAbbreviation } from './NounSection';

export const usePermissionToggles = (nounGroup, onToggle) => {
  const isChecked = useCallback(
    (verb, roleId) => !!nounGroup.verbs.find(v => v.verb === verb)?.roles[roleId],
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
          hasPermission: currentValue,
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
              hasPermission: false,
            });
          }
        }
      } else {
        const idx = VERB_HIERARCHY.indexOf(verb);
        if (idx > 0) {
          const superiorVerbs = VERB_HIERARCHY.slice(0, idx);
          for (const superior of superiorVerbs) {
            if (availableVerbs.has(superior) && isChecked(superior, role.id)) {
              toggles.push({
                verb: superior,
                noun: nounGroup.noun,
                objectId: nounGroup.objectId,
                roleId: role.id,
                hasPermission: true,
              });
            }
          }
        }
      }

      onToggle(toggles);
    },
    [nounGroup.noun, nounGroup.objectId, isChecked, availableVerbs, onToggle],
  );

  const getSummary = useCallback(
    roleId =>
      nounGroup.verbs
        .filter(v => isChecked(v.verb, roleId))
        .map(v => getVerbAbbreviation(v.verb))
        .join(' '),
    [nounGroup.verbs, isChecked],
  );

  return { isChecked, handleToggle, getSummary };
};
