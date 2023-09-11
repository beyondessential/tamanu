"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    AuthExpiredError: ()=>_errors.AuthExpiredError,
    ServerResponseError: ()=>_errors.ServerResponseError,
    ServerUnavailableError: ()=>_errors.ServerUnavailableError,
    VersionIncompatibleError: ()=>_errors.VersionIncompatibleError,
    setFetchImplementation: ()=>_fetch.setFetchImplementation,
    TamanuApi: ()=>_tamanuApi.TamanuApi
});
const _errors = require("./errors");
const _fetch = require("./fetch");
const _tamanuApi = require("./TamanuApi");

//# sourceMappingURL=index.js.map