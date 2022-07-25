import { log } from 'shared/services/logging';

export function newStatsRow({ created = 0, updated = 0, errored = 0 } = {}) {
  return { created, updated, errored };
}

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
