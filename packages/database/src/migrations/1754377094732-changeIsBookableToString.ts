import { DataTypes, QueryInterface } from 'sequelize';
import { LOCATION_BOOKABLE_VIEW } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn('location_groups', 'is_bookable', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: LOCATION_BOOKABLE_VIEW.NO,
  });

  await query.sequelize.query(`
    UPDATE location_groups 
    SET is_bookable = CASE 
      WHEN is_bookable = 'true' THEN '${LOCATION_BOOKABLE_VIEW.ALL}'
      ELSE '${LOCATION_BOOKABLE_VIEW.NO}'
    END
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE location_groups 
    SET is_bookable = CASE 
        WHEN is_bookable = 'no' THEN 'false'
        ELSE 'true'
    END
  `);

  await query.sequelize.query(`
    ALTER TABLE location_groups 
    ALTER COLUMN is_bookable TYPE boolean USING is_bookable::boolean,
    ALTER COLUMN is_bookable SET NOT NULL,
    ALTER COLUMN is_bookable SET DEFAULT false;
  `);
}
