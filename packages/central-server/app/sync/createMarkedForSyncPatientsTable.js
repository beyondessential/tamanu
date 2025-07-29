import { getMarkedForSyncPatientsTableName } from '@tamanu/database/sync';

export const createMarkedForSyncPatientsTable = async (
  sequelize,
  sessionId,
  isFullSync,
  facilityIds,
  since,
) => {
  const tableName = getMarkedForSyncPatientsTableName(sessionId, isFullSync);

  await sequelize.query(
    `
    CREATE TABLE ${tableName} AS
    SELECT patient_id
    FROM patient_facilities
    WHERE facility_id in (:facilityIds)
    ${
      // TODO: add comment here about why not updated_at_sync_tick
      isFullSync
        ? 'AND created_at_sync_tick > :since' // get all the NEW marked for sync patients if it is FULL sync
        : 'AND created_at_sync_tick <= :since' // get all the EXISTING marked for sync patients if it is regular sync
    }
  `,
    {
      replacements: {
        facilityIds,
        since,
      },
      type: sequelize.QueryTypes.SELECT,
    },
  );

  return tableName;
};
