import { readFileInDocuments, deleteFileInDocuments } from '../../../ui/helpers/file';

export const clearPersistedSyncSessionRecords = async (): Promise<void> => {
  let currentBatchIndex = 0;
  while (true) {
    const fileName = `batch${currentBatchIndex}.json`;
    let batchString;
    try {
      batchString = await readFileInDocuments(fileName, 'utf8');
    } catch (e) {
      batchString = '';
      //ignore
    }

    if (!batchString) {
      break;
    } else {
      deleteFileInDocuments(fileName);
    }

    currentBatchIndex++;
  }
};
