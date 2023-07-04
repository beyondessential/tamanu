import { log } from 'shared/services/logging';

export function statkey(model, sheetName) {
  return model === 'ReferenceData' ? `${model}/${sheetName}` : model;
}

const BASE_STAT_ROW = {
  created: 0,
  updated: 0,
  errored: 0,
  deleted: 0,
  restored: 0,
  skipped: 0,
};

const STAT_KEYS = Object.keys(BASE_STAT_ROW);

/* eslint-disable no-param-reassign */
export function updateStat(stats, key, field, incr = 1) {
  stats[key] = stats[key] || { ...BASE_STAT_ROW };
  stats[key][field] += incr;
}
/* eslint-enable no-param-reassign */

export function coalesceStats(statGroups) {
  const allStats = {};
  for (const stat of statGroups) {
    for (const [key, stats] of Object.entries(stat)) {
      const existing = allStats[key];
      if (existing) {
        STAT_KEYS.forEach(k => {
          existing[k] = (existing[k] || 0) + (stats[k] || 0);
        });
      } else {
        allStats[key] = { ...BASE_STAT_ROW, ...stats };
      }
    }
  }

  log.debug('Imported lotsa things', { stats: allStats });
  return allStats;
}
