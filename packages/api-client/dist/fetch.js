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
    setFetchImplementation: ()=>setFetchImplementation,
    fetchOrThrowIfUnavailable: ()=>fetchOrThrowIfUnavailable,
    getResponseErrorSafely: ()=>getResponseErrorSafely
});
const _errors = require("./errors");
let fetchImplementation;
// eslint-disable-next-line no-undef
if (typeof window !== 'undefined' && Object.hasOwnProperty.call(window, 'fetch')) {
    // eslint-disable-next-line no-undef
    fetchImplementation = window.fetch.bind(window);
}
function setFetchImplementation(implementation) {
    fetchImplementation = implementation;
}
async function fetchOrThrowIfUnavailable(url, config) {
    try {
        const response = await fetchImplementation(url, config);
        return response;
    } catch (e) {
        if (e instanceof Error && e.message === 'Failed to fetch') {
            // apply more helpful message if the server is not available
            throw new _errors.ServerUnavailableError('The server is unavailable. Please check with your system administrator that the address is set correctly, and that it is running');
        }
        throw e; // some other unhandled error
    }
}
async function getResponseErrorSafely(response) {
    try {
        return await response.json();
    } catch (e) {
        // log json parsing errors, but still return a valid object
        // eslint-disable-next-line no-console
        console.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
        return {
            error: {
                name: 'JSONParseError',
                message: `Error parsing JSON: ${e}`
            }
        };
    }
}

//# sourceMappingURL=fetch.js.map