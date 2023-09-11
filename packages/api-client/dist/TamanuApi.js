/// <reference path="../../shared/types/errors.d.ts" />
/// <reference path="../../shared/types/buildAbility.d.ts" />
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TamanuApi", {
    enumerable: true,
    get: ()=>TamanuApi
});
const _qs = /*#__PURE__*/ _interopRequireDefault(require("qs"));
const _constants = require("@tamanu/constants");
const _errors = require("@tamanu/shared/errors");
const _buildAbility = require("@tamanu/shared/permissions/buildAbility");
const _errors1 = require("./errors");
const _fetch = require("./fetch");
function _checkPrivateRedeclaration(obj, privateCollection) {
    if (privateCollection.has(obj)) {
        throw new TypeError("Cannot initialize the same private elements twice on an object");
    }
}
function _classApplyDescriptorGet(receiver, descriptor) {
    if (descriptor.get) {
        return descriptor.get.call(receiver);
    }
    return descriptor.value;
}
function _classApplyDescriptorSet(receiver, descriptor, value) {
    if (descriptor.set) {
        descriptor.set.call(receiver, value);
    } else {
        if (!descriptor.writable) {
            throw new TypeError("attempted to set read only private field");
        }
        descriptor.value = value;
    }
}
function _classExtractFieldDescriptor(receiver, privateMap, action) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to " + action + " private field on non-instance");
    }
    return privateMap.get(receiver);
}
function _classPrivateFieldGet(receiver, privateMap) {
    var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get");
    return _classApplyDescriptorGet(receiver, descriptor);
}
function _classPrivateFieldInit(obj, privateMap, value) {
    _checkPrivateRedeclaration(obj, privateMap);
    privateMap.set(obj, value);
}
function _classPrivateFieldSet(receiver, privateMap, value) {
    var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
    _classApplyDescriptorSet(receiver, descriptor, value);
    return value;
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var _host = /*#__PURE__*/ new WeakMap(), _prefix = /*#__PURE__*/ new WeakMap(), _onAuthFailure = /*#__PURE__*/ new WeakMap(), _onVersionIncompatible = /*#__PURE__*/ new WeakMap(), _authHeader = /*#__PURE__*/ new WeakMap();
let TamanuApi = class TamanuApi {
    setHost(host) {
        const canonicalHost = host.endsWith('/') ? host.slice(0, -1) : host;
        _classPrivateFieldSet(this, _host, canonicalHost);
        _classPrivateFieldSet(this, _prefix, `${canonicalHost}/v1`);
    }
    getHost() {
        return _classPrivateFieldGet(this, _host);
    }
    setAuthFailureHandler(handler) {
        _classPrivateFieldSet(this, _onAuthFailure, handler);
    }
    setVersionIncompatibleHandler(handler) {
        _classPrivateFieldSet(this, _onVersionIncompatible, handler);
    }
    async login(host, email, password) {
        this.setHost(host);
        const response = await this.post('login', {
            email,
            password,
            deviceId: this.deviceId
        }, {
            returnResponse: true
        });
        const serverType = response.headers.get('X-Tamanu-Server');
        if (![
            _constants.SERVER_TYPES.LAN,
            _constants.SERVER_TYPES.SYNC
        ].includes(serverType)) {
            throw new Error(`Tamanu server type '${serverType}' is not supported.`);
        }
        const { token , localisation , server ={} , permissions , centralHost , role  } = await response.json();
        server.type = serverType;
        server.centralHost = centralHost;
        this.setToken(token);
        const { user , ability  } = await this.fetchUserData(permissions);
        return {
            user,
            token,
            localisation,
            server,
            ability,
            role
        };
    }
    async fetchUserData(permissions) {
        const user = await this.get('user/me');
        this.lastRefreshed = Date.now();
        this.user = user;
        if (!permissions) {
            // TODO: fetch permissions from server
            return {
                user,
                ability: (0, _buildAbility.buildAbilityForUser)(user, [])
            };
        }
        const ability = (0, _buildAbility.buildAbilityForUser)(user, permissions);
        return {
            user,
            ability
        };
    }
    async requestPasswordReset(host, email) {
        this.setHost(host);
        return this.post('resetPassword', {
            email
        });
    }
    async changePassword(host, args) {
        this.setHost(host);
        return this.post('changePassword', args);
    }
    async refreshToken() {
        try {
            const response = await this.post('refresh');
            const { token  } = response;
            this.setToken(token);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    }
    setToken(token) {
        _classPrivateFieldSet(this, _authHeader, {
            authorization: `Bearer ${token}`
        });
    }
    async fetch(endpoint, query = {}, config = {}) {
        if (!_classPrivateFieldGet(this, _host)) {
            throw new Error("API can't be used until the host is set");
        }
        const { headers , returnResponse =false , throwResponse =false , ...otherConfig } = config;
        const queryString = _qs.default.stringify(query || {});
        const path = `${endpoint}${query ? `?${queryString}` : ''}`;
        const url = `${_classPrivateFieldGet(this, _prefix)}/${path}`;
        const response = await (0, _fetch.fetchOrThrowIfUnavailable)(url, {
            headers: {
                ..._classPrivateFieldGet(this, _authHeader),
                ...headers,
                'X-Tamanu-Client': this.agentName,
                'X-Version': this.agentVersion
            },
            ...otherConfig
        });
        if (response.ok) {
            if (returnResponse) {
                return response;
            }
            if (response.status === 204) {
                return null;
            }
            return response.json();
        }
        if (throwResponse) {
            throw response;
        }
        return this.extractError(endpoint, response);
    }
    /**
   * Handle errors from the server response.
   *
   * Generally only used internally.
   */ async extractError(endpoint, response) {
        const { error  } = await (0, _fetch.getResponseErrorSafely)(response);
        const message = error?.message || response.status.toString();
        // handle forbidden error and trigger catch all modal
        if (response.status === 403 && error) {
            throw new _errors.ForbiddenError(message);
        }
        if (response.status === 404) {
            throw new _errors.NotFoundError(message);
        }
        // handle auth expiring
        if (response.status === 401 && endpoint !== 'login' && _classPrivateFieldGet(this, _onAuthFailure)) {
            const message = 'Your session has expired. Please log in again.';
            _classPrivateFieldGet(this, _onAuthFailure).call(this, message);
            throw new _errors1.AuthExpiredError(message);
        }
        // handle version incompatibility
        if (response.status === 400 && error) {
            const versionIncompatibleMessage = (0, _errors1.getVersionIncompatibleMessage)(error, response);
            if (versionIncompatibleMessage) {
                if (_classPrivateFieldGet(this, _onVersionIncompatible)) {
                    _classPrivateFieldGet(this, _onVersionIncompatible).call(this, versionIncompatibleMessage);
                }
                throw new _errors1.VersionIncompatibleError(versionIncompatibleMessage);
            }
        }
        throw new _errors1.ServerResponseError(`Server error response: ${message}`);
    }
    async get(endpoint, query = {}, config = {}) {
        return this.fetch(endpoint, query, {
            ...config,
            method: 'GET'
        });
    }
    async download(endpoint, query = {}) {
        const response = await this.fetch(endpoint, query, {
            returnResponse: true
        });
        const blob = await response.blob();
        return blob;
    }
    async post(endpoint, body, config = {}) {
        return this.fetch(endpoint, {}, {
            body: body && JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            },
            ...config,
            method: 'POST'
        });
    }
    async put(endpoint, body, config = {}) {
        return this.fetch(endpoint, {}, {
            body: body && JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            },
            ...config,
            method: 'PUT'
        });
    }
    async delete(endpoint, query = {}, config = {}) {
        return this.fetch(endpoint, query, {
            ...config,
            method: 'DELETE'
        });
    }
    constructor(agentName, agentVersion, deviceId){
        _classPrivateFieldInit(this, _host, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _prefix, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _onAuthFailure, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _onVersionIncompatible, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _authHeader, {
            writable: true,
            value: void 0
        });
        this.agentName = agentName;
        this.agentVersion = agentVersion;
        this.deviceId = deviceId;
    }
};

//# sourceMappingURL=TamanuApi.js.map