import { dummyReferenceRecords } from '~/dummyData/referenceData';

export interface SyncRecordData {
  id: string;
  lastModified: Date;
  [key: string]: any;
}

export interface SyncRecord {
  recordType: string;
  data: SyncRecordData;
}

export interface SyncSource {
  getReferenceData(since: Date): Promise<SyncRecord[]>;
  getPatientData(patientId: string, since: Date): Promise<SyncRecord[]>;
}

export class DummySyncSource implements SyncSource {

  async getReferenceData(since: Date): Promise<SyncRecord[]> {
    const records = dummyReferenceRecords
      .filter(x => x.data.lastModified > since)
      // .slice(0, 4);
    // simulate a download delay
    await new Promise((resolve) => setTimeout(resolve, 100 * records.length));
    return records;
  }

  async getPatientData(patientId: string, since: Date): Promise<SyncRecord[]> {
    return [];
  }

}

export class WebSyncSource implements SyncSource {

  constructor(host: String) {
    this.host = host;
  }

  async request(channel: string, since: Date) {
    const sinceStamp = since.valueOf();
    const url = `${this.host}/${channel}?since=${sinceStamp}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        authorization: '123',
      }
    });
    const data = await response.json();

    return data.records;
  }

  async getReferenceData(since: Date): Promise<SyncRecord[]> {
    return await this.request('reference', since);
  }

  async getPatientData(patientId: string, since: Date): Promise<SyncRecord[]> {
    return [];
  }
}
