import { configOverridesForScope } from '../../configToSettings';
import { Reader } from './Reader';

// Serves a deployment's local config value for any key that has no setting recorded
// yet, so config moving into settings never changes behaviour. Which keys, their
// scope, and their (post-rename) setting path come from the CONFIG_TO_SETTINGS map.
export class SettingsConfigReader extends Reader {
  scope: string;
  constructor(scope: string) {
    super();
    this.scope = scope;
  }

  async getSettings() {
    return configOverridesForScope(this.scope);
  }
}
