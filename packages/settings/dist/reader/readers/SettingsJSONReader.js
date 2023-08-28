"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SettingsJSONReader", {
    enumerable: true,
    get: ()=>SettingsJSONReader
});
const _reader = require("./Reader");
let SettingsJSONReader = class SettingsJSONReader extends _reader.Reader {
    getSettings() {
        return this.jsonConfig;
    }
    constructor(jsonConfig){
        super();
        this.jsonConfig = jsonConfig;
    }
};

//# sourceMappingURL=SettingsJSONReader.js.map