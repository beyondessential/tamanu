import { QueryResult, Transaction, open } from '@op-engineering/op-sqlite';

const enhanceQueryResult = (result: QueryResult): void => {
  result.rows.item = (idx: number) => result.rows[idx];
};

export const typeORMDriver = {
  openDatabase: (
    options: {
      name: string;
      location?: string;
    },
    ok: (db: any) => void,
    fail: (msg: string) => void
  ): any => {
    try {
      const database = open({
        location: options.location,
        name: options.name,
      });
      const connection = {
        executeSql: async (
          sql: string,
          params: any[] | undefined,
          ok: (res: QueryResult) => void,
          fail: (msg: string) => void
        ) => {
          try {
            const response = await database.execute(sql, params);
            enhanceQueryResult(response);
            ok(response);
          } catch (e) {
            fail(`[op-sqlite]: Error executing SQL: ${e as string}`);
          }
        },
        transaction: (
          fn: (tx: Transaction) => Promise<void>
        ): Promise<void> => {
          return database.transaction(fn);
        },
        close: (ok: any, fail: any) => {
          try {
            database.close();
            ok();
          } catch (e) {
            fail(`[op-sqlite]: Error closing db: ${e as string}`);
          }
        },
        attach: (
          dbNameToAttach: string,
          alias: string,
          location: string | undefined,
          callback: () => void
        ) => {
          database.attach(options.name, dbNameToAttach, alias, location);
          callback();
        },
        detach: (alias: string, callback: () => void) => {
          database.detach(options.name, alias);
          callback();
        },
      };
      ok(connection);
      return connection;
    } catch (e) {
      fail(`[op-sqlite]: Error opening database: ${e as string}`);
    }
  },
};

export const enableSimpleNullHandling = () => {
  // Op-sqlite handles null values by default, no need to enable
  console.log('[op-sqlite]: Simple null handling is enabled by default');
};
