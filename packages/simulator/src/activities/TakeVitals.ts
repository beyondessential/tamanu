import { Activity, CallArgs, Role } from './prelude.js';

export class TakeVitals extends Activity {
  #patientId?: string;
  #encounterId?: string;

  async gather(args: CallArgs): Promise<void> {
    this.#patientId = args.patientId as string;
    this.#encounterId = args.encounterId as string;
  }

  async act(role: Role): Promise<void> {
    const _api = await this.context.api.as(role);
  }
}
