import { Column, Entity } from 'typeorm';

import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

@Entity('sync_benchmarks')
export class SyncBenchmark extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.DO_NOT_SYNC

  @Column({ nullable: false })
  sessionId: string;

  @Column({ type: 'text', nullable: false })
  benchmark: string; // JSON stored as text since TypeORM doesn't have native JSON support in SQLite

  // Helper methods for working with JSON benchmark data
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

  // Static helper method to create a benchmark with JSON data
  static createWithData(sessionId: string, benchmarkData: object): SyncBenchmark {
    const benchmark = new SyncBenchmark();
    benchmark.sessionId = sessionId;
    benchmark.setBenchmarkData(benchmarkData);
    return benchmark;
  }
} 