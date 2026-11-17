import { DataTypes, Op, QueryTypes, Transaction } from 'sequelize';
import { JOB_QUEUE_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { FACT_SCHEDULED_TASK_HOLD_UNTIL } from '@tamanu/constants/facts';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

// spec: SLPWK#going-to-sleep
//
// A task starting a run takes a shared lock on the hold's row (FACT_SCHEDULED_TASK_HOLD_UNTIL),
// and setting the hold takes an exclusive one, so either the task's start commits first and the
// hold sees it running, or the task waits and sees the hold. Both run at READ COMMITTED, so each
// sees what the other committed while it waited.
//
// Not synced, and excluded from change logging (services/migrations/constants.ts).
export class ScheduledTaskState extends Model {
  declare id: string;
  declare name: string;
  declare runningSince?: Date | null;
  declare lastStartedAt?: Date | null;
  declare lastFinishedAt?: Date | null;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: { type: DataTypes.TEXT, allowNull: false, unique: true },
        runningSince: { type: DataTypes.DATE, allowNull: true },
        lastStartedAt: { type: DataTypes.DATE, allowNull: true },
        lastFinishedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [{ name: 'scheduled_task_states_name', fields: ['name'], unique: true }],
      },
    );
  }

  /**
   * Lock the hold's row and say whether the hold is current. Must run inside a transaction: the
   * lock lasts until it ends. The row is created when missing, so there is always one to lock.
   */
  static async lockHold(lock: 'FOR SHARE' | 'FOR UPDATE'): Promise<boolean> {
    await this.sequelize.query(
      `
        INSERT INTO local_system_facts (key, value)
        VALUES ($key, NULL)
        ON CONFLICT (key) DO NOTHING
      `,
      { bind: { key: FACT_SCHEDULED_TASK_HOLD_UNTIL } },
    );
    const [{ isHeld }] = await this.sequelize.query<{ isHeld: boolean }>(
      `
        SELECT coalesce(value::timestamptz > now(), false) AS "isHeld"
        FROM local_system_facts
        WHERE key = $key
        ${lock}
      `,
      { bind: { key: FACT_SCHEDULED_TASK_HOLD_UNTIL }, type: QueryTypes.SELECT },
    );
    return isHeld;
  }

  /**
   * Hold scheduled tasks for `durationMs`, unless a task is running or a FHIR job is queued or in
   * progress, in which case no hold is left.
   *
   * The FHIR workers do not check the hold: the supervisor asks only once no request is in flight
   * and it has stopped forwarding them, so with tasks held nothing else queues a FHIR job before
   * it stops the workers. A job queued later, such as by a final sync, waits for the wake.
   */
  static async holdUnlessBusy(
    durationMs: number,
  ): Promise<{ busy: false } | { busy: true; runningTasks: string[]; fhirJobs: number }> {
    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async () => {
        await this.setHold(durationMs);
        // After the hold's lock, so these see every run that committed as started before it.
        const runningTasks = await this.runningTaskNames();
        const fhirJobs = await this.sequelize.models.FhirJob.count({
          where: { status: [JOB_QUEUE_STATUSES.QUEUED, JOB_QUEUE_STATUSES.STARTED] },
        });
        if (runningTasks.length === 0 && fhirJobs === 0) {
          return { busy: false };
        }
        await this.releaseHold();
        return { busy: true, runningTasks, fhirJobs };
      },
    );
  }

  /**
   * Hold scheduled tasks for `durationMs`: no task starts a run until it expires or is released.
   * Must run inside a READ COMMITTED transaction, so a check for running tasks made after it, in
   * the same transaction, sees every run that started before it.
   */
  static async setHold(durationMs: number): Promise<void> {
    await this.lockHold('FOR UPDATE');
    await this.sequelize.query(
      `
        UPDATE local_system_facts
        SET value = (now() + $durationMs::double precision * interval '1 millisecond')::text, updated_at = now()
        WHERE key = $key
      `,
      { bind: { key: FACT_SCHEDULED_TASK_HOLD_UNTIL, durationMs } },
    );
  }

  /** Release the hold. Releasing when there is no hold does nothing. */
  static async releaseHold(): Promise<void> {
    await this.sequelize.query(
      `
        UPDATE local_system_facts
        SET value = NULL, updated_at = now()
        WHERE key = $key
      `,
      { bind: { key: FACT_SCHEDULED_TASK_HOLD_UNTIL } },
    );
  }

  /**
   * Record a run of the task as started, unless scheduled tasks are held.
   * @returns whether the run may go ahead
   */
  static async startRun(name: string): Promise<boolean> {
    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async () => {
        if (await this.lockHold('FOR SHARE')) {
          return false;
        }
        await this.sequelize.query(
          `
            INSERT INTO scheduled_task_states (name, running_since, last_started_at)
            VALUES ($name, now(), now())
            ON CONFLICT (name) DO UPDATE
            SET running_since = now(), last_started_at = now(), updated_at = now()
          `,
          { bind: { name } },
        );
        return true;
      },
    );
  }

  /** Record the task's run as finished, whatever its outcome. */
  static async finishRun(name: string): Promise<void> {
    await this.sequelize.query(
      `
        UPDATE scheduled_task_states
        SET running_since = NULL, last_finished_at = now(), updated_at = now()
        WHERE name = $name
      `,
      { bind: { name } },
    );
  }

  /**
   * Clear the running state of these tasks, left behind by a tasks process that stopped mid-run.
   * Called when a tasks process starts, with the names of the tasks it runs, so it leaves alone
   * the tasks of any other process.
   */
  static async clearRunning(names: string[]): Promise<void> {
    if (names.length === 0) return;
    await this.sequelize.query(
      `
        UPDATE scheduled_task_states
        SET running_since = NULL, updated_at = now()
        WHERE name IN (:names) AND running_since IS NOT NULL
      `,
      { replacements: { names } },
    );
  }

  /** The names of the tasks with a run in progress. */
  static async runningTaskNames(): Promise<string[]> {
    const rows = await this.findAll({
      attributes: ['name'],
      where: { runningSince: { [Op.ne]: null } },
      order: [['name', 'ASC']],
    });
    return rows.map(row => row.name);
  }
}
