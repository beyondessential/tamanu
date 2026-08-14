import { log } from '@tamanu/shared/services/logging';

import { fetchModels } from '../anthropicModelSuggestions.js';

const MODEL_PATH = 'ai.anthropicModel';
const FAST_MODEL_PATH = 'ai.anthropicFastModel';

const latestOf = (models, family) =>
  models
    .filter(({ id }) => id.includes(family))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

/**
 * Fills the model settings the first time an API key is saved, so a deployment
 * that has just been given a key is usable without picking models by hand.
 *
 * Only ever fills a blank field, and only on the save that introduces the key:
 * an empty fast model means "fall back to the main model", which is a real
 * configuration an admin may have chosen deliberately.
 *
 * Best-effort. This runs inside the settings save, so a slow or unreachable
 * model list must never fail an unrelated settings change.
 */
export const applyDefaultAiModels = async ({ Setting, readSettings, scope, facilityId }) => {
  try {
    const stored = (await Setting.get('ai', facilityId, scope)) ?? {};
    if (stored.anthropicModel && stored.anthropicFastModel) return;

    const models = await fetchModels(readSettings);
    if (models.length === 0) return;

    const applied = [];
    if (!stored.anthropicModel) {
      const opus = latestOf(models, 'opus');
      if (opus) {
        await Setting.set(MODEL_PATH, opus.id, scope, facilityId);
        applied.push(opus.id);
      }
    }
    if (!stored.anthropicFastModel) {
      const haiku = latestOf(
        models.filter(({ supportsVision }) => supportsVision),
        'haiku',
      );
      if (haiku) {
        await Setting.set(FAST_MODEL_PATH, haiku.id, scope, facilityId);
        applied.push(haiku.id);
      }
    }

    if (applied.length > 0) {
      log.info(`applyDefaultAiModels: selected ${applied.join(', ')}`);
    }
  } catch (error) {
    log.warn(`applyDefaultAiModels: could not select default models: ${error.message}`);
  }
};
