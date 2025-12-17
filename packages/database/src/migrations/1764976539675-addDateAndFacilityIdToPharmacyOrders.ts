import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('pharmacy_orders', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });

  await query.addColumn('pharmacy_orders', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'facilities',
      key: 'id',
    },
  });

  // Backfill date and facility_id columns using a single bulk UPDATE query
  await query.sequelize.query(
    `
    UPDATE pharmacy_orders
    SET
      date = SUBSTRING(pharmacy_orders.created_at::TEXT, 1, 19),
      facility_id = locations.facility_id
    FROM
      encounters
    INNER JOIN
      locations ON locations.id = encounters.location_id
    WHERE
      pharmacy_orders.encounter_id = encounters.id;
    `,
  );

  // Check if there are any rows with NULL facility_id before making the column non-nullable
  const nullCountResult: any = await query.sequelize.query(
    `SELECT COUNT(*) as count FROM pharmacy_orders WHERE facility_id IS NULL;`,
    { type: QueryTypes.SELECT },
  );

  const nullCount = parseInt(nullCountResult[0].count, 10);
  if (nullCount > 0) {
    throw new Error(
      `Cannot make facility_id non-nullable: ${nullCount} pharmacy order(s) have NULL facility_id. ` +
      `These orders may be missing encounters or encounters may be missing locations.`,
    );
  }

  await query.changeColumn('pharmacy_orders', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });

  await query.changeColumn('pharmacy_orders', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('pharmacy_orders', 'facility_id');
  await query.removeColumn('pharmacy_orders', 'date');
}
