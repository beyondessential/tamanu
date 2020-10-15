export interface SyncRecordData {
  id: string;
  updatedAt: Date;
  [key: string]: any;
}

export interface SyncRecord {
  recordType: string;
  data: SyncRecordData;
}

export interface SyncSource {
  getSyncData(channel: string, since: Date, page: number): Promise<SyncRecord[]>;
}

export class WebSyncSource implements SyncSource {
  host: string;

  constructor(host: string) {
    this.host = host;
  }

  async getSyncData(channel: string, since: Date, page: number): Promise<SyncRecord[]> {
    // TODO: error handling (incl timeout)
    const PAGE_LIMIT = 100;
    const sinceStamp = since.valueOf();
    const url = `${this.host}/${channel}?since=${sinceStamp}&page=${page}&limit=${PAGE_LIMIT}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          authorization: '123',
        },
      });
      const data = await response.json();

      return data.records;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}
