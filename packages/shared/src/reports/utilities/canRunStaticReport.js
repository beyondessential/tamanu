import { subject } from '@casl/ability';

export function canRunStaticReport(ability, id, permission) {
  const canReadPermission = permission && ability.can('read', permission);
  const canRunReport = ability.can('run', subject('StaticReport', { id }));
  return canReadPermission || canRunReport;
}
