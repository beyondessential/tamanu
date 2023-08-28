"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReadSettings", {
    enumerable: true,
    get: ()=>ReadSettings
});
const _lodash = require("lodash");
const _buildSettings = require("./buildSettings");
const _cache = require("../cache");
let ReadSettings = class ReadSettings {
    async get(key) {
        let settings = _cache.settingsCache.get();
        if (!settings) {
            settings = await (0, _buildSettings.buildSettings)(this.models, this.facilityId);
            _cache.settingsCache.set(settings);
        }
        return (0, _lodash.get)(settings, key);
    }
    constructor(models, facilityId){
        this.models = models;
        this.facilityId = facilityId;
    }
};

//# sourceMappingURL=ReadSettings.js.map