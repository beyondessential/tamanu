class AuditLogItem {
  userId = '';
  resolved = false;

  annotations = null;
  permissionChecks = [];

  shouldKeep() {
    // any permissions check should be logged
    if (this.permissionChecks.length > 0) return true;

    // or if we've annotated it with anything extra
    if (this.annotations) return true;

    // nothing relevant to log, discard
    return false;
  }

  resolve() {
    if (this.resolved) {
      throw new Error("Audit log entry resolved twice somehow");
    }
    this.resolved = true;

    if (!this.shouldKeep()) return;

    // just log to console for now, 
    log.info('auditLogEntry', {
      userId: this.userId,
      data: this.annotations,
      perms: this.permissionChecks,
    });
  }

  annotate(data) {
    // in the first annotation this.annotations will be null but that's fine
    this.annotations = { ...this.annotations, ...data };
  }

  addPermissionCheck(verb, noun, objectId) {
    this.permissionChecks.push({ verb, noun, objectId });
  }
}

const auditMiddleware = async (req, res, next) => {
  const audit = new AuditLogItem();
  req.audit = audit;

  const localisation = await req.getLocalisation();
  // only attach the resolver if audit logs are enabled
  // (without this bit, all the audit logs will just be discarded)
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
