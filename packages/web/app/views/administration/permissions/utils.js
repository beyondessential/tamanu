import { NOUN_TYPES } from './constants';

export function buildNouns(permissions, selectedRoleIds) {
  const regularMap = {};
  const objectIdMap = {};

  for (const permission of permissions) {
    const { verb, noun, objectId } = permission;
    if (objectId) {
      const nounKey = `${noun} (${objectId})`;
      if (!objectIdMap[noun]) objectIdMap[noun] = {};
      if (!objectIdMap[noun][objectId]) {
        objectIdMap[noun][objectId] = { nounKey, noun, objectId, verbs: {} };
      }
      if (!objectIdMap[noun][objectId].verbs[verb]) {
        objectIdMap[noun][objectId].verbs[verb] = {};
      }
      for (const roleId of selectedRoleIds) {
        objectIdMap[noun][objectId].verbs[verb][roleId] = permission[roleId] === 'y';
      }
    } else {
      if (!regularMap[noun]) {
        regularMap[noun] = { nounKey: noun, noun, objectId: null, verbs: {} };
      }
      if (!regularMap[noun].verbs[verb]) {
        regularMap[noun].verbs[verb] = {};
      }
      for (const roleId of selectedRoleIds) {
        regularMap[noun].verbs[verb][roleId] = permission[roleId] === 'y';
      }
    }
  }

  const finalise = group => ({
    ...group,
    verbs: Object.entries(group.verbs).map(([verb, roles]) => ({ verb, roles })),
  });

  // Regular nouns (e.g. Survey)
  const regularGroups = Object.values(regularMap)
    .map(finalise)
    .map(g => ({ type: NOUN_TYPES.NOUN, noun: g.nounKey, data: g }));

  // Object ID groups (e.g. Survey (objectID) which would expand to show all the individual Surveys)
  const objectIdGroups = Object.entries(objectIdMap).map(([noun, entries]) => ({
    type: NOUN_TYPES.OBJECT_ID_GROUP,
    noun,
    data: {
      noun,
      children: Object.values(entries) // Child Object IDs (e.g. Survey 123, Survey 456, Survey 789) within the group
        .map(finalise)
        .map(g => ({ ...g, type: NOUN_TYPES.OBJECT_ID }))
        .sort((a, b) => a.objectId.localeCompare(b.objectId)),
    },
  }));

  return [...regularGroups, ...objectIdGroups].sort((a, b) => a.noun.localeCompare(b.noun));
}
