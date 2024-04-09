import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class LabRequestAttachments extends Model {
    static init({ primaryKey, ...options }) {
        super.init(
            {
                id: primaryKey,
                // Relation can't be managed by sequelize because the
                // attachment won't get downloaded to facility server
                attachmentId: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                title: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                isVisible: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: false,
                },
            },
            { ...options, syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL },
        );
    }

    static initRelations(models) {
        this.belongsTo(models.LabRequest, {
            foreignKey: 'labRequestId',
            as: 'labRequest',
        });
    }

    static buildSyncFilter() {
        return null; // syncs everywhere
    }
}
