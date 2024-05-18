import { getMarkedForSyncPatientsTableName } from '@tamanu/shared/sync';

export const createMarkedForSyncPatientsTable = async (
  sequelize,
  sessionId,
  isFullSync,
  facilityId,
  since,
) => {
  const tableName = getMarkedForSyncPatientsTableName(sessionId, isFullSync);

  await sequelize.query(
    `
    CREATE TABLE ${tableName} AS
    SELECT patient_id
    FROM patient_facilities
    WHERE facility_id = :facilityId
    ${
      isFullSync
        ? 'AND updated_at_sync_tick > :since' // get all the NEW marked for sync patients if it is FULL sync
        : 'AND updated_at_sync_tick <= :since' // get all the EXISTING marked for sync patients if it is regular sync
    }
  `,
    {
      replacements: {
        facilityId,
        since,
      },
      type: sequelize.QueryTypes.SELECT,
    },
  );
};
