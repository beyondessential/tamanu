import type { Encounter } from './Encounter';
import { Model } from './Model';

export class Task extends Model {
  // eslint-disable-next-line no-unused-vars
  static async onEncounterDischarged(_encounter: Encounter) {}
}
