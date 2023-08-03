import { Intake } from '../activities/Intake.js';
import { Player } from '../board/Player.js';

export class Receptionist extends Player {
  readonly role = 'practitioner';
  readonly routine = [Intake];
}
