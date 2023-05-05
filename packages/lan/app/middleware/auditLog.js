class AuditLogItem {
  userId = '';
  resolved = false;

  data = {};

  permissionChecks = [];

  shouldDiscard() {
    return false;
  }

  resolve() {
    if (this.shouldDiscard()) return;

    // TODO: persist somewhere
    console.log('AUDIT', {
      userId: this.userId,
      data: this.data,
      perms: this.permissionChecks,
    });
  }

  annotate(data) {
    this.data = { ...this.data, ...data };
  }

  addPermissionCheck(verb, noun, objectId) {
    this.permissionChecks.push({ verb, noun, objectId });
  }
}

const auditMiddleware = (req, res, next) => {
  const audit = new AuditLogItem();
  req.audit = audit;

  const oldSend = res.send;
  res.send = (...args) => {
    // TODO: temporary line to hunt down why this is getting called twice sometimes
    res.send = () => { throw new Error("double send??") };
    audit.userId = req.user?.id;
    audit.resolve();
    oldSend.call(res, ...args);
  };

  next();
};

export function getAuditMiddleware() {
  return auditMiddleware;
}
