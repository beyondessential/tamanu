
export interface SyncRecordData {
  id: string;
  updatedAt: Date;
  [key: string]: any;
}

export interface SyncRecord {
  recordType: string;
  data: SyncRecordData;
}

export interface SyncPage {
  records: SyncRecord[];
  nextPage?: number;
}

export interface SyncSource {
  getSyncData(channel: string, since: Date, page: number): Promise<SyncPage>;
}

export class WebSyncSource implements SyncSource {

  constructor(host: String) {
    this.host = host;
  }

  async getSyncData(channel: string, since: Date, page: number): Promise<SyncPage> {
    // TODO: error handling (incl timeout)
    const PAGE_LIMIT = 100;
    const sinceStamp = since.valueOf();
    const url = `${this.host}/${channel}?since=${sinceStamp}&page=${page}&limit=${PAGE_LIMIT}`;
    console.log(url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        authorization: '123',
      }
    });
    const data = await response.json();
    const expectedCount = PAGE_LIMIT * (page + 1);
    const nextPage = (data.count > expectedCount) ? (page + 1) : 0;

    return {
      records: data.records,
      nextPage,
    }
  }
}
