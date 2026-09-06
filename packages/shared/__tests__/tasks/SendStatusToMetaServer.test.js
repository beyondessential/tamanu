import { describe, expect, it, vi } from 'vitest';
import { QueryTypes } from 'sequelize';

import { SendStatusToMetaServer } from '../../src/tasks/SendStatusToMetaServer';

// Bypasses the constructor, which reads schedule config and service context it
// does not need to answer this query.
const taskReturning = rows => {
  const query = vi.fn().mockResolvedValue(rows);
  const task = Object.create(SendStatusToMetaServer.prototype);
  task.sequelize = { query };
  return { task, query };
};

describe('SendStatusToMetaServer', () => {
  describe('getReportingSchemaVersion', () => {
    it('reports the version stamped on the reporting schema', async () => {
      const { task, query } = taskReturning([{ version: '2.60.1' }]);

      await expect(task.getReportingSchemaVersion()).resolves.toBe('2.60.1');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('obj_description'),
        expect.objectContaining({
          type: QueryTypes.SELECT,
          replacements: { schema: 'reporting' },
        }),
      );
    });

    it('reports null when the schema carries no stamp', async () => {
      const { task } = taskReturning([{ version: null }]);
      await expect(task.getReportingSchemaVersion()).resolves.toBeNull();
    });

    it('reports null when there is no reporting schema', async () => {
      const { task } = taskReturning([]);
      await expect(task.getReportingSchemaVersion()).resolves.toBeNull();
    });
  });
});
