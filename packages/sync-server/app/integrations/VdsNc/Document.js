import { VdsNcDocument } from 'shared/models';
import { vdsConfig } from '.';

export async function createAndSignDocument(icaoType, translatedData, uniqueProofId) {
  const document = await VdsNcDocument.create({
    type: icaoType,
    messageData: JSON.stringify(translatedData),
    uniqueProofId,
  });

  await document.sign(vdsConfig().keySecret);
  return document;
}
