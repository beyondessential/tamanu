import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Create location_assignment_templates table
  await query.createTable('location_assignment_templates', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    location_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    date: {
      type: DataTypes.DATESTRING,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    repeat_end_date: {
      type: DataTypes.DATESTRING,
      allowNull: false,
    },
    repeat_frequency: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 1,
    },
    repeat_unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create location_assignments table
  await query.createTable('location_assignments', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    location_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    date: {
      type: DataTypes.DATESTRING,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'location_assignment_templates',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('location_assignments');
  await query.dropTable('location_assignment_templates', {});
}
