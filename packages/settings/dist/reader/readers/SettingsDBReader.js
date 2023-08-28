"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SettingsDBReader", {
    enumerable: true,
    get: ()=>SettingsDBReader
});
const _reader = require("./Reader");
let SettingsDBReader = class SettingsDBReader extends _reader.Reader {
    getSettings() {
        const { Setting  } = this.models;
        // Get all settings for the selected scope/facility
        const settings = Setting.get('', this.facilityId, this.scope);
        return settings;
    }
    constructor(models, scope, facilityId){
        super();
        this.models = models;
        this.scope = scope;
        this.facilityId = facilityId;
    }
};

//# sourceMappingURL=SettingsDBReader.js.map