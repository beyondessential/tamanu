function flattenObj(obj, parent, res = {}) {
  Object.keys(obj).forEach(key => {
    const propName = parent ? `${parent}.${key}` : key;
    if (typeof obj[key] === 'object') {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  });
  return res;
}

function getNestedKeys(obj) {
  const flat = flattenObj(obj);
  const keys = Object.keys(flat);
  return keys;
}

function getSignature(message, keys) {
  keys.sort();
  return `${message}:${keys.join('|')}`;
}

export class LogSignatureCache {
  cache = {};

  needsWrite = false;

  checkSignature(message, payload) {
    const keys = getNestedKeys(payload);
    const signature = getSignature(message, keys);
    const cached = this.cache[signature];

    if (cached) {
      return cached.safe && !cached.forbid;
    }

    console.log('>>>>> LogSignatureCache.newMessage', { signature });
    this.cache[signature] = {
      signature,
      message,
      keys,
      safe: false,
      forbid: false,
      newSinceWrite: true,
    };
    this.needsWrite = true;
    return false;
  }

  async writeToDatabase(LogSignature) {
    const cacheClone = { ...this.cache };
    this.needsWrite = false;
    return Promise.all(
      Object.values(cacheClone)
        .filter(x => x.newSinceWrite)
        .map(async message => {
          const { newSinceWrite, signature, ...record } = message;
          LogSignature.upsert(record);
        }),
    );
  }

  async readFromDatabase(LogSignature) {
    const allRecords = await LogSignature.findAll();
    allRecords.forEach(record => {
      const { safe, forbid, message, keys } = record;
      const signature = getSignature(message, keys);
      this.cache[signature] = {
        safe,
        forbid,
        message,
        keys,
        signature,
        newSinceWrite: false,
      };
    });
  }
}
