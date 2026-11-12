import {
  registerSettingsCacheInvalidator,
  registerSettingsPathListener,
} from '@tamanu/settings/cache';
import { log } from '@tamanu/shared/services/logging';

import { AI_SETTING_PATHS } from './services/AIService';

/**
 * Keeps the settings cache, and the state derived from settings, current as the
 * settings table changes.
 *
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export function registerSettingsListeners(ctx, onTableChanged, { onReconnect }) {
  registerSettingsCacheInvalidator(onTableChanged, { onReconnect });

  const resolveChangedKey = async ({ newId, oldId }) => {
    const id = newId ?? oldId;
    if (!id) return null;
    const setting = await ctx.store.models.Setting.findByPk(id, { paranoid: false });
    return setting?.key ?? null;
  };

  const logAiRefreshError = error =>
    log.warn({ error }, 'Failed to refresh the AI service after a settings change');

  registerSettingsPathListener(onTableChanged, {
    paths: AI_SETTING_PATHS,
    resolveChangedKey,
    onChange: () => ctx.refreshAiService(),
    onError: logAiRefreshError,
  });

  // a settings change while the listener was disconnected would otherwise go unnoticed
  onReconnect(() => ctx.refreshAiService().catch(logAiRefreshError));
}
