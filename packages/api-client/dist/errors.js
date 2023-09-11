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
    ServerResponseError: ()=>ServerResponseError,
    AuthExpiredError: ()=>AuthExpiredError,
    VersionIncompatibleError: ()=>VersionIncompatibleError,
    ServerUnavailableError: ()=>ServerUnavailableError,
    getVersionIncompatibleMessage: ()=>getVersionIncompatibleMessage
});
const _constants = require("@tamanu/constants");
let ServerResponseError = class ServerResponseError extends Error {
};
let AuthExpiredError = class AuthExpiredError extends ServerResponseError {
};
let VersionIncompatibleError = class VersionIncompatibleError extends ServerResponseError {
};
let ServerUnavailableError = class ServerUnavailableError extends Error {
};
function getVersionIncompatibleMessage(error, response) {
    if (error.message === _constants.VERSION_COMPATIBILITY_ERRORS.LOW) {
        const minAppVersion = response.headers.get('X-Min-Client-Version');
        return `Please upgrade to Tamanu Desktop v${minAppVersion} or higher. Try closing and reopening, or contact your system administrator.`;
    }
    if (error.message === _constants.VERSION_COMPATIBILITY_ERRORS.HIGH) {
        const maxAppVersion = response.headers.get('X-Max-Client-Version');
        return `The Tamanu LAN Server only supports up to v${maxAppVersion}, and needs to be upgraded. Please contact your system administrator.`;
    }
    return null;
}

//# sourceMappingURL=errors.js.map