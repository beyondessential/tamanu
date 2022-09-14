import { Sequelize, Model } from 'sequelize';

export class FhirResource extends Model {
  static init(attributes, options = {}) {
    super.init(
      {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          default: Sequelize.UUIDV4,
          primaryKey: true,
        },
        versionId: {
          type: Sequelize.UUID,
          allowNull: false,
          default: Sequelize.UUIDV4,
        },
        upstreamId: {
          type: Sequelize.STRING(36),
          allowNull: false,
        },
        lastUpdated: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        ...attributes,
      },
      { ...options, schema: 'fhir' },
    );
  }
}
