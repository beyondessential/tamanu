import { Op } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { deleteRedundantLocalCopies } from '../../dist/sync/deleteRedundantLocalCopies';

describe('deleteRedundantLocalCopies', () => {
  it('should delete records for models marked as PUSH_TO_CENTRAL_THEN_DELETE', async () => {
    const changes = [
      { recordType: 'testPushThenDeleteTable', recordId: '1' },
      { recordType: 'testPushThenDeleteTable', recordId: '2' },
      { recordType: 'testPushTable', recordId: '3' },
      { recordType: 'testPushTable', recordId: '4' },
    ];

    const mockModels = {
      TestPushThenDeleteModel: {
        tableName: 'testPushThenDeleteTable',
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE,
        destroy: jest.fn(),
      },
      TestPushModel: {
        tableName: 'testPushTable',
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
        destroy: jest.fn(),
      },
    };

    await deleteRedundantLocalCopies(mockModels, changes);

    expect(mockModels.TestPushThenDeleteModel.destroy).toHaveBeenCalledWith({
      where: {
        id: { [Op.in]: ['1', '2'] },
      },
      force: true,
    });

    expect(mockModels.TestPushModel.destroy).not.toHaveBeenCalled();
  });
});
