import { AttachmentCleanupTask } from '../../app/tasks/AttachmentCleanupTask';
import { FACT_CURRENT_SYNC_TICK, FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { createTestContext } from '../utilities';

describe('AttachmentCleanupTask', () => {
  let context;
  let models;

  beforeAll(async () => {
    context = await createTestContext();
    models = context.models;
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '10');
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PUSH, '12');
    await models.Attachment.destroy({ where: {}, force: true });
  });

  describe('run', () => {
    it('should cleanup attachments that have been successfully synced', async () => {
      await models.Attachment.create({
        id: 'test-id-one',
        type: 'image/jpeg',
        size: 1024,
        data: Buffer.from('test', 'base64'),
      });
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '20');
      await models.Attachment.create({
        id: 'test-id-two',
        type: 'image/jpeg',
        size: 2048,
        data: Buffer.from('test', 'base64'),
      });
      const task = new AttachmentCleanupTask(context);
      await task.run();

      const attachments = await models.Attachment.findAll({ paranoid: false });

      expect(attachments.length).toBe(1);
      expect(attachments[0].id).toBe('test-id-two');
    });

    it('should handle empty attachment list', async () => {
      await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, '20');
      await models.Attachment.create({
        id: 'test-id-one',
        type: 'image/jpeg',
        size: 1024,
        data: Buffer.from('test', 'base64'),
      });

      const task = new AttachmentCleanupTask(context);
      await task.run();
      const attachments = await models.Attachment.findAll({ paranoid: false });

      expect(attachments.length).toBe(1);
    });
  });
});
