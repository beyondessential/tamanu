/* eslint-disable no-unused-vars */
// remove the above line

import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('user_preferences', 'preferences', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE "user_preferences"
    SET "preferences" = jsonb_build_object(
      'encounterTabOrders', "encounter_tab_orders"::jsonb,
      'selectedGraphedVitalsOnFilter', "selected_graphed_vitals_on_filter",
      'locationBookingFilters', "location_booking_filters"::jsonb,
      'outpatientppointmentFilters', "outpatient_appointment_filters"::jsonb
    );
  `);

  await query.removeColumn('user_preferences', 'encounter_tab_orders');
  await query.removeColumn('user_preferences', 'selected_graphed_vitals_on_filter');
  await query.removeColumn('user_preferences', 'location_booking_filters');
  await query.removeColumn('user_preferences', 'outpatient_appointment_filters');
}

export async function down(query) {
  await query.addColumn('user_preferences', 'encounter_tab_orders', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await query.addColumn('user_preferences', 'selected_graphed_vitals_on_filter', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addColumn('user_preferences', 'location_booking_filters', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await query.addColumn('user_preferences', 'outpatient_appointment_filters', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE "user_preferences"
    SET 
      "encounter_tab_orders" = "preferences"->'encounterTabOrders',
      "selected_graphed_vitals_on_filter" = "preferences"->'selectedGraphedVitalsOnFilter',
      "location_booking_filters" = "preferences"->'locationBookingFilters',
      "outpatient_appointment_filters" = "preferences"->'outpatientppointmentFilters'
  `);

  await query.removeColumn('user_preferences', 'preferences');
}
