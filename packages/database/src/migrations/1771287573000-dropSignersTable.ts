import { type QueryInterface, DataTypes } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.dropTable('signers');
}

// DESTRUCTIVE: Private key data and signer certificates will not be restored
export async function down(query: QueryInterface): Promise<void> {
  await query.createTable('signers', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    country_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    private_key: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    public_key: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    request: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    request_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    certificate: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    working_period_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    working_period_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validity_period_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validity_period_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    signatures_issued: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
}
