import { log } from '@tamanu/shared/services/logging';
import config from 'config';

// this class is only exported for testing and is not expected to be used directly
export class AuditLogItem {
  userId = '';

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
    // just log to console/honeycomb for now
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

  const logsEnabled = config.log.enableAuditLog;
  // only attach the resolver if audit logs are enabled
  // (without this bit, all the audit logs will just be discarded)
  if (logsEnabled) {
    res.on('finish', () => {
      audit.userId = req.user?.id;

      if (!audit.shouldKeep()) return;
      audit.resolve();
    });
  }

  next();
};

export function getAuditMiddleware() {
  return auditMiddleware;
}
