
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
