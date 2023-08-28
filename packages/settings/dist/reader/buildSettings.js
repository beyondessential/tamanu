"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "buildSettings", {
    enumerable: true,
    get: ()=>buildSettings
});
const _lodash = require("lodash");
const _constants = require("@tamanu/constants");
const _central = require("../defaults/central");
const _facility = require("../defaults/facility");
const _global = require("../defaults/global");
const _settingsDBReader = require("./readers/SettingsDBReader");
const _settingsJSONReader = require("./readers/SettingsJSONReader");
function getReaders(models, facilityId) {
    return facilityId ? [
        new _settingsDBReader.SettingsDBReader(models, _constants.SETTINGS_SCOPES.FACILITY, facilityId),
        new _settingsDBReader.SettingsDBReader(models, 'global'),
        new _settingsJSONReader.SettingsJSONReader(_facility.facilityDefaults),
        new _settingsJSONReader.SettingsJSONReader(_global.globalDefaults)
    ] : [
        new _settingsDBReader.SettingsDBReader(models, 'central'),
        new _settingsDBReader.SettingsDBReader(models, 'global'),
        new _settingsJSONReader.SettingsJSONReader(_central.centralDefaults),
        new _settingsJSONReader.SettingsJSONReader(_global.globalDefaults)
    ];
}
async function buildSettings(models, facilityId) {
    const readers = getReaders(models, facilityId);
    let settings = {};
    for (const reader of readers){
        const value = await reader.getSettings();
        if (value) {
            // Prioritize the previous one
            settings = (0, _lodash.merge)(value, settings);
        }
    }
    return settings;
}

//# sourceMappingURL=buildSettings.js.map