import { Player } from '../board/Player.js';
import { Intake } from '../activities/Intake.js';

export class Receptionist extends Player {
  readonly role = 'practitioner';
  readonly routine = [Intake];
}
