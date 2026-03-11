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
  
    const regularGroups = Object.values(regularMap)
      .map(finalise)
      .map(g => ({ type: 'noun', noun: g.nounKey, data: g }));
  
    const objectIdGroups = Object.entries(objectIdMap).map(([noun, entries]) => ({
      type: 'objectId',
      noun,
      data: {
        noun,
        children: Object.values(entries)
          .map(finalise)
          .sort((a, b) => a.objectId.localeCompare(b.objectId)),
      },
    }));
  
    return [...regularGroups, ...objectIdGroups].sort((a, b) => a.noun.localeCompare(b.noun));
  }