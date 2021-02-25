import config from 'config';

import { ScheduledTask } from 'shared/tasks';
import { log } from '~/logging';

import { SyncManager, WebRemote } from '~/sync';

export class SyncTask extends ScheduledTask {
  constructor(context) {
    super(config.sync.schedule, log);

    const remote = new WebRemote(context);
    remote.connect();
    this.manager = new SyncManager(context, remote);

    this.runImmediately();
  }

  async run() {
    return this.manager.runSync();
  }
}
