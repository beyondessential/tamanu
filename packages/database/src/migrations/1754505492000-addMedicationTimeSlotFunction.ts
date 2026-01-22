import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION get_medication_time_slot(input_datetime TIMESTAMP)
    RETURNS TABLE(start_time TIMESTAMP, end_time TIMESTAMP)
    LANGUAGE plpgsql
    AS $$
    DECLARE
        input_hour INTEGER;
        slot_start_hour INTEGER;
        slot_end_hour INTEGER;
        base_date DATE;
    BEGIN
        -- Extract hour and minute from input
        input_hour := EXTRACT(HOUR FROM input_datetime);
        base_date := DATE(input_datetime);

        -- Calculate which 2-hour slot this time falls into
        -- Time slots: 00:00-02:00, 02:00-04:00, 04:00-06:00, 06:00-08:00, etc.
        slot_start_hour := (input_hour / 2) * 2;  -- Integer division, then multiply by 2
        slot_end_hour := slot_start_hour + 2;

        -- Handle the edge case where slot_end_hour is 24 (should be 00:00 next day)
        IF slot_end_hour = 24 THEN
            slot_end_hour := 0;
            RETURN QUERY SELECT
                (base_date + (slot_start_hour || ' hours')::INTERVAL)::TIMESTAMP as start_time,
                ((base_date + INTERVAL '1 day') + (slot_end_hour || ' hours')::INTERVAL)::TIMESTAMP as end_time;
        ELSE
            RETURN QUERY SELECT
                (base_date + (slot_start_hour || ' hours')::INTERVAL)::TIMESTAMP as start_time,
                (base_date + (slot_end_hour || ' hours')::INTERVAL)::TIMESTAMP as end_time;
        END IF;
    END;
    $$;
  `);
}

export async function down(query: QueryInterface) {
  await query.sequelize.query(`
    DROP FUNCTION IF EXISTS get_medication_time_slot(TIMESTAMP);
  `);
}
