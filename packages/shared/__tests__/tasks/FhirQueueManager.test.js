import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FhirQueueManager } from '../../src/tasks/fhir/FhirQueueManager';

const HEARTBEAT_MS = 60_000;

const makeManager = () => {
  const manager = new FhirQueueManager({ models: {}, sequelize: {} }, {}, { error: vi.fn() });
  manager.heartbeatIntervalMs = HEARTBEAT_MS;
  manager.detonate = vi.fn();
  manager.processQueueNow = vi.fn();
  manager.queueProcessors.set('fhir.refresh.fromUpstream', {});
  return manager;
};

describe('FhirQueueManager after the NOTIFY listener reconnects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('picks up jobs whose NOTIFYs were lost during the gap', () => {
    const manager = makeManager();
    manager.handleListenerReconnected();
    expect(manager.processQueueNow).toHaveBeenCalledWith('fhir.refresh.fromUpstream');
  });

  it('does not mistake processing the gap jobs for a dead listener', () => {
    const manager = makeManager();
    // last NOTIFY well before a failover
    manager.lastNotifyAt = Date.now();
    vi.advanceTimersByTime(3 * HEARTBEAT_MS);

    manager.handleListenerReconnected();
    // the gap's jobs are grabbed without any NOTIFY for them
    manager.recordJobGrabbed();
    manager.detectDeadListener();

    expect(manager.detonate).not.toHaveBeenCalled();
  });
});
