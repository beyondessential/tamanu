# Context

Use this rule when implementing comprehensive benchmarking for sync systems or similar hierarchical timing requirements in the Tamanu codebase. Apply specifically when you need to:

- Add performance monitoring to sync operations with nested timing structures (Routes → Operations → Actions → SubActions)
- Track route-level timing that distinguishes between HTTP overhead and actual business logic operations
- Handle multiple calls to the same endpoint with proper indexing (e.g., polling scenarios)
- Ensure timing accuracy that matches console.time measurements within 1-2ms
- Create session-wide benchmarks that aggregate multiple route calls and show both individual processing time and total session duration including client polling intervals

# Process

## 1. Create Session Timing Aggregator Structure

Create a session-level timing aggregator in `CentralSyncManager.js` that tracks:
- Multiple routes per session with unique keys for duplicate route names
- Route call counting with indexed naming (e.g., `checkReady (#2)`)
- Hierarchical structure: Session → Routes → Operations → Actions → SubActions

```javascript
const createSessionTimingAggregator = (sessionId, store) => {
  const sessionStartTime = Date.now();
  const routeCallCounts = new Map(); // Track multiple calls to same route
  const routes = new Map(); // Store route entries with unique keys
  
  return {
    createRouteTimer: (routeName, isMobile = false) => {
      const routeStartTime = Date.now();
      
      // Generate unique route key with call index for multiple calls
      const currentCallCount = (routeCallCounts.get(routeName) || 0) + 1;
      routeCallCounts.set(routeName, currentCallCount);
      const routeKey = currentCallCount > 1 ? `${routeName}_${currentCallCount}` : routeName;
      const displayName = currentCallCount > 1 ? `${routeName} (#${currentCallCount})` : routeName;
      
      const timing = createTimingLogger(displayName, sessionId, isMobile, routeStartTime);
      
      // Store route entry with unique key
      routes.set(routeKey, {
        routeName: displayName,
        originalRouteName: routeName,
        callIndex: currentCallCount,
        isMobile,
        startTime: routeStartTime,
        endTime: null,
        benchmarkData: null,
        operations: new Map(),
      });
      
      return timing;
    }
  };
};
```

## 2. Implement Accurate Route Timing

Create route timing that captures full HTTP request lifecycle by passing custom start time:
- Capture `routeStartTime` immediately when creating route timer
- Pass this to `createTimingLogger` as the fourth parameter to measure from route creation, not first log call
- This ensures route timing matches console.time measurements for accuracy validation

```javascript
// In createRouteTimer method
const routeStartTime = Date.now(); // Capture immediately
const timing = createTimingLogger(displayName, sessionId, isMobile, routeStartTime);
```

Update `createTimingLogger` signature to accept custom start time:
```javascript
const createTimingLogger = (operation, sessionId, isMobile = false, customStartTime = null) => {
  const startTime = customStartTime || Date.now();
  // ... rest of implementation
};
```

## 3. Structure Route-Level Operations Consistently

Ensure all operations have consistent structure with required fields. In the `saveTimingsToDebugInfo` override:

```javascript
// Convert route actions to operations format with consistent structure
routeEntry.routeOperations = benchmarkData.actions.map(action => ({
  name: action.name,
  startTime: new Date(routeEntry.startTime).toISOString(),
  endTime: new Date(routeEntry.endTime).toISOString(),
  totalDurationMs: action.durationMs,
  actions: (action.subActions && action.subActions.length > 0) ? 
    action.subActions.map(sa => ({
      name: sa.name,
      durationMs: sa.durationMs,
      ...(sa.callCount > 1 && { 
        callCount: sa.callCount,
        averageDurationMs: sa.averageDurationMs 
      }),
    })) : [], // Always include actions array, even if empty
  ...(action.callCount > 1 && { 
    callCount: action.callCount,
    averageDurationMs: action.averageDurationMs 
  }),
}));
```

## 4. Add Route-Level Timing Integration

In route handlers (`buildSyncRoutes.js`), integrate timing at the start of each handler:

```javascript
// At the start of each route handler
const routeTiming = syncManager.createRouteTiming(sessionId, 'routeName');

// ... route logic and sync manager calls ...

// Save route timing before finalising session benchmark
if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
```

For the endSession route specifically, call session finalisation after saving route timing:
```javascript
// Save route timing first
if (routeTiming) await routeTiming.saveTimingsToDebugInfo();

// Then finalise and save complete session benchmark
await syncManager.finalizeSessionBenchmark(sessionId);
```

## 5. Handle Multiple Route Calls with Proper Indexing

Implement route call indexing to track polling behaviour clearly:
- First call: `checkReady` (no index)
- Second call: `checkReady (#2)`
- Third call: `checkReady (#3)`
- Each gets separate timing entry in final benchmark

This is automatically handled by the `routeCallCounts` Map in the session aggregator.

## 6. Nest Sync Manager Operations Under Routes

Modify the `createOperationTimer` method to find the most recent route for nesting:

```javascript
if (routeName) {
  // Find the most recent route entry for this route name
  let targetRouteKey = null;
  let latestStartTime = 0;
  
  for (const [key, entry] of routes.entries()) {
    if (entry.originalRouteName === routeName && entry.startTime > latestStartTime) {
      targetRouteKey = key;
      latestStartTime = entry.startTime;
    }
  }
  
  if (targetRouteKey && routes.has(targetRouteKey)) {
    const routeEntry = routes.get(targetRouteKey);
    routeEntry.operations.set(operation, {
      operation,
      isMobile,
      startTime: operationStartTime,
      endTime: Date.now(),
      ...benchmarkData,
      ...additionalData,
    });
  }
}
```

## 7. Create Hierarchical Benchmark Output

Structure final benchmark with proper hierarchy and timing data:

```json
{
  "benchmark": {
    "totalDurationMs": 2447, // Full session wall-clock time (includes polling gaps)
    "routes": [
      {
        "name": "checkReady (#2)",
        "startTime": "2025-06-24T20:52:01.173Z",
        "endTime": "2025-06-24T20:52:01.186Z", 
        "totalDurationMs": 13, // Route processing time only
        "operations": [
          {
            "name": "Check Session Ready", // Sync manager operation
            "startTime": "2025-06-24T20:52:01.173Z",
            "endTime": "2025-06-24T20:52:01.185Z",
            "totalDurationMs": 12,
            "actions": [
              { "name": "connectToSession", "durationMs": 10 },
              { "name": "sessionReady", "durationMs": 1 }
            ]
          }
        ]
      }
    ]
  }
}
```

## 8. Validate Timing Accuracy

Create test scripts to verify timing accuracy by comparing different measurement approaches:

```javascript
// Test timing accuracy
console.time('routeTest');
const routeStartTime = Date.now();
const timing = createTimingLogger('test', 'session', false, routeStartTime);
// ... simulate work ...
console.timeEnd('routeTest');
const benchmarkData = timing.getBenchmarkData();
// Should match within 1-2ms
```

## 9. Handle Session Finalisation and Cleanup

Implement proper session cleanup in the correct order:
1. Save all route timings via `saveTimingsToDebugInfo()`
2. Call `finalizeSessionBenchmark(sessionId)` to aggregate and save complete benchmark
3. Clean up session aggregator from memory

```javascript
// In CentralSyncManager
async finalizeSessionBenchmark(sessionId) {
  const sessionAggregator = this.sessionTimingAggregators.get(sessionId);
  if (sessionAggregator) {
    await sessionAggregator.finalizeSession();
    this.sessionTimingAggregators.delete(sessionId); // Clean up memory
  }
}
```

# Avoid

- Don't create timing objects without passing custom start time for routes - this causes timing accuracy issues where route timing misses initial processing time and won't match console.time measurements
- Don't overwrite route entries for multiple calls to same endpoint - use unique keys with call indexing instead, or polling behaviour won't be visible in benchmarks
- Don't expect route operation durations to sum exactly to route total duration - wall-clock time includes polling intervals and network delays between requests that individual operations don't measure
- Don't create route-level operations without consistent structure - all operations need startTime, endTime, and actions array for proper benchmark format, even if actions is empty
- Don't save individual route or operation benchmarks to debug_info - only save the final aggregated session benchmark to avoid data duplication and inconsistent timing data
- Don't call `finalizeSessionBenchmark()` before saving all route timings - this will result in incomplete benchmark data
- Don't forget to clean up session aggregators from memory after finalisation - this prevents memory leaks in long-running processes

## 10. Create Mobile TypeORM Implementation

For mobile devices using TypeORM (SQLite), create separate sync benchmark storage since `sync_sessions` don't sync from central to mobile:

### TypeORM Entity (`packages/mobile/App/models/SyncBenchmark.ts`):
```typescript
import { Column, Entity } from 'typeorm';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

@Entity('sync_benchmarks')
export class SyncBenchmark extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC; // Keep mobile-only

  @Column({ nullable: false })
  sessionId: string;

  @Column({ type: 'text', nullable: false })
  benchmark: string; // JSON stored as text (SQLite limitation)

  // Helper methods for JSON handling
  setBenchmarkData(data: object): void {
    this.benchmark = JSON.stringify(data);
  }

  getBenchmarkData(): object {
    try {
      return JSON.parse(this.benchmark);
    } catch (error) {
      console.error('Failed to parse benchmark JSON:', error);
      return {};
    }
  }

  static createWithData(sessionId: string, benchmarkData: object): SyncBenchmark {
    const benchmark = new SyncBenchmark();
    benchmark.sessionId = sessionId;
    benchmark.setBenchmarkData(benchmarkData);
    return benchmark;
  }
}
```

### TypeORM Migration (`packages/mobile/App/migrations/[timestamp]-createSyncBenchmarksTable.ts`):
```typescript
import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

const TABLE_NAME = 'sync_benchmarks';

const BaseColumns = [
  new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
  new TableColumn({ name: 'createdAt', type: 'datetime', default: "datetime('now')" }),
  new TableColumn({ name: 'updatedAt', type: 'datetime', default: "datetime('now')" }),
  new TableColumn({ name: 'updatedAtSyncTick', type: 'bigint', isNullable: false, default: -999 }),
  new TableColumn({ name: 'deletedAt', isNullable: true, type: 'date', default: null }),
];

const SyncBenchmarksTable = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({ name: 'sessionId', type: 'varchar', isNullable: false }),
    new TableColumn({ name: 'benchmark', type: 'text', isNullable: false }),
  ],
  indices: [
    new TableIndex({ name: 'idx_sync_benchmarks_session_id', columnNames: ['sessionId'] }),
    new TableIndex({ name: 'idx_sync_benchmarks_created_at', columnNames: ['createdAt'] }),
    new TableIndex({ name: 'idx_sync_benchmarks_updated_at_sync_tick', columnNames: ['updatedAtSyncTick'] }),
  ],
});

export class createSyncBenchmarksTable[timestamp] implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(SyncBenchmarksTable, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
```

### Register Model and Migration:
- Add to `packages/mobile/App/models/modelsMap.ts` in both import and MODELS_MAP object
- Add to `packages/mobile/App/migrations/index.ts` in both import and migrationList array
- Use `DO_NOT_SYNC` direction to keep benchmark data mobile-only (prevents syncing to central server)

### Usage Pattern:
```typescript
// Save mobile benchmark
const benchmark = SyncBenchmark.createWithData(sessionId, benchmarkData);
await benchmark.save();

// Query mobile benchmarks
const benchmarks = await SyncBenchmark.find({ where: { sessionId } });
const data = benchmarks[0].getBenchmarkData();
```

# Notes

Use Australian/NZ English spelling and terminology throughout (e.g., "finalise" not "finalize", "behaviour" not "behavior"). The session totalDurationMs represents complete wall-clock time from first route to last route, which includes client polling intervals and network delays, while individual route durations represent only server processing time. This difference is expected and valuable for understanding both server performance and client behaviour patterns.

For mobile implementations, use `DO_NOT_SYNC` direction to prevent benchmark data from syncing to central server, keeping mobile performance data local to the device.

## 11. Implement Mobile Sync Benchmarking

For mobile sync using MobileSyncManager, implement comprehensive timing following the same hierarchical structure:

### Mobile Timing Utilities:
```typescript
// Add to MobileSyncManager.ts
const createTimingLogger = (operation: string, sessionId: string, customStartTime: number = null) => {
  const startTime = customStartTime || Date.now();
  const actions = [];
  let lastActionTime = startTime;

  return {
    logAction: (actionName: string, additionalData = {}) => {
      const now = Date.now();
      const durationMs = now - lastActionTime;
      
      actions.push({
        name: actionName,
        durationMs,
        ...additionalData,
      });
      
      lastActionTime = now;
    },

    getBenchmarkData: () => ({
      operation,
      sessionId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      totalDurationMs: Date.now() - startTime,
      actions,
    }),
  };
};
```

### Mobile Session Aggregator:
```typescript
const createMobileSyncSessionAggregator = (sessionId: string) => {
  const sessionStartTime = Date.now();
  const operations = new Map();

  return {
    createOperationTimer: (operationName: string, customStartTime: number = null) => {
      const timing = createTimingLogger(operationName, sessionId, customStartTime);
      operations.set(operationName, { operationName, startTime: customStartTime || Date.now(), timing });
      return timing;
    },

    async finalizeSession() {
      const sessionBenchmark = {
        sessionId,
        totalDurationMs: Date.now() - sessionStartTime,
        startTime: new Date(sessionStartTime).toISOString(),
        endTime: new Date().toISOString(),
        operations: Array.from(operations.values()).map(op => ({
          name: op.operationName,
          ...op.timing.getBenchmarkData(),
        })),
      };

      // Save to mobile database using SyncBenchmark model
      const { SyncBenchmark } = Database.models;
      const benchmark = SyncBenchmark.createWithData(sessionId, sessionBenchmark);
      await benchmark.save();
      
      return sessionBenchmark;
    },
  };
};
```

### Integration Points:
1. **MobileSyncManager.runSync()**: Initialize session aggregator after getting sessionId
2. **syncOutgoingChanges()**: Create operation timer and log key actions (getSyncTick, snapshotChanges, pushChanges)
3. **syncIncomingChanges()**: Create operation timer and log actions (pullChanges, saveChanges)
4. **CentralServerConnection methods**: Accept optional timing parameter and log API calls:
   - `startSyncSession()`: Log session start, queue status, polling waits
   - `initiatePull()`: Log pull initiation, polling waits, metadata retrieval
   - `completePush()`: Log push completion, polling waits
5. **Utility functions**: Update `pullIncomingChanges`, `pushOutgoingChanges`, and `saveIncomingChanges` to accept and use timing for granular performance tracking

### Mobile Benchmark Structure:
```json
{
  "sessionId": "uuid",
  "totalDurationMs": 15420,
  "startTime": "2025-01-25T10:30:00.000Z",
  "endTime": "2025-01-25T10:30:15.420Z",
  "operations": [
    {
      "name": "Sync Outgoing Changes",
      "totalDurationMs": 3200,
      "actions": [
        { "name": "setSyncStage", "durationMs": 1, "stage": 1 },
        { "name": "getCurrentSyncTick", "durationMs": 15, "currentSyncTick": 12345 },
        { "name": "snapshotOutgoingChanges", "durationMs": 850, "changesCount": 45 },
        { "name": "pushOutgoingChanges", "durationMs": 2300, "changesCount": 45, "successful": true }
      ]
    },
    {
      "name": "Sync Incoming Changes", 
      "totalDurationMs": 12100,
      "actions": [
        { "name": "initiatePull", "durationMs": 2500, "tableCount": 15 },
        { "name": "waitForPullReady", "durationMs": 5200 },
        { "name": "pullIncomingChanges", "durationMs": 3800, "totalPulled": 1250 },
        { "name": "saveIncomingChanges", "durationMs": 600, "savedSuccessfully": true }
      ]
    }
  ]
}
```