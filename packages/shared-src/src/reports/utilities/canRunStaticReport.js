// pseudo-model so we can define permissions for 'run', 'StaticReport'
class StaticReport {
  id = null;

  constructor(id) {
    this.id = id;
  }
}

export function canRunStaticReport(ability, id, permission) {
  const canReadPermission = permission && ability.can('read', permission);
  const canRunReport = ability.can('run', new StaticReport(id));
  return canReadPermission || canRunReport;
}
