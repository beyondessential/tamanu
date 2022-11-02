export const getFilePath = (sessionId: string, recordType: string, batchIndex: number): string => {
  const directory = `syncSessions/${sessionId}/${recordType}`;
  const fileName = `batch${batchIndex.toString().padStart(10, '0')}.json`;
  return `${directory}/${fileName}`;
};
