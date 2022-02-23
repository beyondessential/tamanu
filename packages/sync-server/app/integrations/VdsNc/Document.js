import { VdsNcDocument } from 'shared/models';
import { vdsConfig } from '.';

export async function createAndSignDocument(icaoType, translatedData) {
  const document = await VdsNcDocument.create({
    type: icaoType,
    messageData: JSON.stringify(translatedData),
  });

  await document.sign(vdsConfig().keySecret);
  return document;
}
