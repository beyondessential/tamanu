# Sync Benchmarking Implementation Rule

## Context

Apply when implementing comprehensive performance monitoring for sync systems with hierarchical timing requirements:
- Routes → Operations → Actions → SubActions structure
- Multiple endpoint calls with polling scenarios
- Timing accuracy matching console.time measurements
- Session-wide benchmarks with individual and total durations

## Implementation Steps

### Central Server Implementation

**1. Session Timing Aggregator** (`CentralSyncManager.js`):
- Track multiple routes with indexed naming (`checkReady (#2)`)
- Hierarchical structure: Session → Routes → Operations → Actions

```javascript
const createSessionTimingAggregator = (sessionId, store) => {
  const sessionStartTime = Date.now();
  const routeCallCounts = new Map();
  const routes = new Map();
  
  return {
    createRouteTimer: (routeName, isMobile = false) => {
      const routeStartTime = Date.now();
      const currentCallCount = (routeCallCounts.get(routeName) || 0) + 1;
      routeCallCounts.set(routeName, currentCallCount);
      const displayName = currentCallCount > 1 ? `${routeName} (#${currentCallCount})` : routeName;
      
      return createTimingLogger(displayName, sessionId, isMobile, routeStartTime);
    }
  };
};
```

**2. Accurate Route Timing**:
- Pass custom start time for full HTTP request lifecycle timing
- Ensures timing accuracy matching console.time measurements

```javascript
const createTimingLogger = (operation, sessionId, isMobile = false, customStartTime = null) => {
  const startTime = customStartTime || Date.now();
  // ... rest of implementation
};
```

**3. Route Integration** (`buildSyncRoutes.js`):
```javascript
// At route handler start
const routeTiming = syncManager.createRouteTiming(sessionId, 'routeName');
// Save before session finalization
if (routeTiming) await routeTiming.saveTimingsToDebugInfo();
await syncManager.finalizeSessionBenchmark(sessionId); // endSession only
```

**4. Central Server Benchmark Structure**:
```json
{
  "benchmark": {
    "totalDurationMs": 2447,
    "routes": [{
      "name": "checkReady (#2)",
      "totalDurationMs": 13,
      "operations": [{
        "name": "Check Session Ready",
        "totalDurationMs": 12,
        "actions": [
          { "name": "connectToSession", "durationMs": 10 }
        ]
      }]
    }]
  }
}
```

### Mobile Implementation

**5. Mobile TypeORM Storage** (since sync_sessions don't sync to mobile):

Entity (`packages/mobile/App/models/SyncBenchmark.ts`):
```typescript
@Entity('sync_benchmarks')
export class SyncBenchmark extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC;
  
  @Column({ nullable: false })
  sessionId: string;
  
  @Column({ type: 'text', nullable: false })
  benchmark: string; // JSON as text for SQLite
  
  setBenchmarkData(data: object): void {
    this.benchmark = JSON.stringify(data);
  }
  
  getBenchmarkData(): object {
    return JSON.parse(this.benchmark);
  }
}
```

**6. Mobile Sync Timing** (`MobileSyncManager.ts`):
```typescript
const createMobileSyncSessionAggregator = (sessionId: string) => {
  const sessionStartTime = Date.now();
  const operations = new Map();

  return {
    createOperationTimer: (operationName: string) => {
      return createTimingLogger(operationName, sessionId);
    },
    
    async finalizeSession() {
      const benchmark = SyncBenchmark.createWithData(sessionId, {
        totalDurationMs: Date.now() - sessionStartTime,
        operations: Array.from(operations.values())
      });
      await benchmark.save();
    }
  };
};
```

**7. Enhanced Granular Timing** for batch operations:
```typescript
// In pullIncomingChanges - per batch timing
timing.logAction('pullBatch', {
  batchIndex,
  batchSize: batch.length,
  pullDurationMs: networkTime,
  processDurationMs: transformTime,
  persistDurationMs: diskTime
});

// In saveIncomingChanges - per model timing  
timing.logAction('saveModel', {
  modelName,
  recordCount,
  readDurationMs: fileReadTime,
  persistDurationMs: dbWriteTime
});
```

## Key Patterns

**Timing Accuracy**: Pass custom start time to capture full lifecycle
**Multiple Calls**: Automatic indexing (`checkReady (#2)`)
**Hierarchical Structure**: Routes → Operations → Actions → SubActions
**Session Aggregation**: Wall-clock total vs individual processing times
**Mobile Storage**: DO_NOT_SYNC direction for local-only benchmarks
**Granular Insights**: Network vs database vs file I/O timing breakdown

## Common Pitfalls

- Missing custom start time causes timing accuracy issues
- Overwriting route entries loses polling visibility  
- Expecting route durations to sum to session total (polling gaps expected)
- Inconsistent operation structure breaks benchmark format
- Calling finalizeSession before saving all route timings
- Memory leaks from not cleaning up session aggregators