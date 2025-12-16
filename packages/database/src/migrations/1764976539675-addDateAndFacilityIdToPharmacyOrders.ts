import { toDateTimeString } from '@tamanu/utils/dateTime';
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

  // Backfill date and facility_id columns
  const pharmacyOrders: any = await query.sequelize.query(
    `
    SELECT p.id, p.encounter_id, p.created_at, l.facility_id FROM pharmacy_orders p
    LEFT JOIN encounters e ON p.encounter_id = e.id
		LEFT JOIN locations l ON l.id = e.location_id
  `,
    { type: QueryTypes.SELECT },
  );
  for (const pharmacyOrder of pharmacyOrders) {
    const date = toDateTimeString(pharmacyOrder.created_at);
    await query.sequelize.query(
      `
      UPDATE pharmacy_orders
      SET date = :date, facility_id = :facility_id
      WHERE id = :id
      `,
      { replacements: { date, facility_id: pharmacyOrder.facility_id, id: pharmacyOrder.id } },
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
