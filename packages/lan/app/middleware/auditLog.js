class AuditLogItem {
  userId = '';
  resolved = false;

  data = {};

  permissionChecks = [];

  shouldPersist() {
    // user only accessed publicly-accessible data, no permissions checked
    if (this.permissionChecks.length === 0) return false;
    return true;
  }

  resolve() {
    if (this.shouldPersist()) return;
    if (this.resolved) {
      throw new Error("Audit log entry resolved twice somehow");
    }
    this.resolved = true;

    log.info('auditLogEntry', {
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

  const localisation = await req.getLocalisation();
  if (localisation.features.enableAuditLogs) {
    res.on('finish', (...args) => {
      audit.userId = req.user?.id;
      audit.resolve();
    });
  }

  next();
};

export function getAuditMiddleware() {
  return auditMiddleware;
}
