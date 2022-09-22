import Sequelize from 'sequelize';

const ADMINISTERED_VACCINE_TABLE_NAME = 'administered_vaccines';
const IMAGING_REQUEST_AREAS_TABLE_NAME = 'imaging_request_areas';

// this migration is now taken care of generically by 101_deleteOldSyncMetadataColumns
// maintaining this empty file so that there's a complete match between files and migrations
// recorded in SequelizeMeta

export async function up() {}

export async function down() {}
