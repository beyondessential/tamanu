function flattenObj(obj, parent, res = {}) {
  console.log({ obj, parent, res });
  Object.keys(obj).forEach(key => {
    const propName = parent ? `${parent}.${key}` : key;
    if (obj[key] && typeof obj[key] === 'object') {
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
  keys.sort();
  return keys.join(',');
}

function getSignature(message, keys) {
  return `${message}::${keys}`;
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
    if(!this.needsWrite) return;

    this.needsWrite = false;
    const newRecords = Object.values(this.cache).filter(x => x.newSinceWrite);
    console.log("SIGNATURECACHE >> Writing to database...", { count: newRecords.length });
    return Promise.all(newRecords.map(async cachedRecord => {
        const { newSinceWrite, signature, message, ...record } = cachedRecord;
        cachedRecord.newSinceWrite = false;
        LogSignature.upsert({
          id: message,
          ...record
        });
      }),
    );
  }

  async readFromDatabase(LogSignature) {
    const allRecords = await LogSignature.findAll();
    console.log("SIGNATURECACHE >> Reading from database...", { count: allRecords.length });
    allRecords.forEach(record => {
      const { id, safe, forbid, message, keys } = record;
      const signature = getSignature(message, keys);
      this.cache[signature] = {
        message: id,
        safe,
        forbid,
        keys,
        signature,
        newSinceWrite: false,
      };
    });
  }

  async linkToDatabase(models) {
    console.log("SIGNATURECACHE >> Linked to DB");
    const { LogSignature } = models;

    await this.readFromDatabase(LogSignature);

    setInterval(async () => {
      this.writeToDatabase(LogSignature);
    }, 10000);
  }
}
