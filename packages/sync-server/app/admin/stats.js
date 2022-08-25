import { log } from 'shared/services/logging';

export function statkey(model, sheetName) {
  return model === 'ReferenceData' ? `${model}/${sheetName}` : model;
}

function newStatsRow({ created = 0, updated = 0, errored = 0 } = {}) {
  return { created, updated, errored };
}

/* eslint-disable no-param-reassign */
export function updateStat(stats, key, field, incr = 1) {
  stats[key] = stats[key] || newStatsRow();
  stats[key][field] += incr;
}
/* eslint-enable no-param-reassign */

export function coalesceStats(stats) {
  const allStats = {};
  for (const stat of stats) {
    for (const [key, { created, updated, errored }] of Object.entries(stat)) {
      if (allStats[key]) {
        allStats[key].created += created;
        allStats[key].updated += updated;
        allStats[key].errored += errored;
      } else {
        allStats[key] = newStatsRow({ created, updated, errored });
      }
    }
  }

  log.debug('Imported lotsa things', { stats: allStats });
  return allStats;
}
