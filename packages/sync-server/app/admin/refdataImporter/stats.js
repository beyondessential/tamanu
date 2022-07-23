import { log } from 'shared/services/logging';

export function newStatsRow({ created = 0, updated = 0, errored = 0 }) {
  return { created, updated, errored };
}

export function coalesceStats(stats) {
  const allStats = {};
  for (const stat of stats) {
    for (const [model, { created, updated, errored }] of Object.entries(stat)) {
      if (allStats[model]) {
        allStats[model].created += created;
        allStats[model].updated += updated;
        allStats[model].errored += errored;
      } else {
        allStats[model] = newStatsRow({ created, updated, errored });
      }
    }
  }

  log.debug('Imported lotsa things', { stats: allStats });
  return allStats;
}
