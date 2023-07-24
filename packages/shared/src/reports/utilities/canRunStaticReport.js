import { subject } from '@casl/ability';

export function canRunStaticReport(ability, id) {
  return ability.can('run', subject('StaticReport', { id }));
}
