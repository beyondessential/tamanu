import { VdsNcDocument } from 'shared/models';
import { vdsConfig } from '.';

export async function createAndSignDocument(
  icaoType,
  translatedData,
  uniqueProofId,
  conf = vdsConfig(),
) {
  const document = await VdsNcDocument.create({
    type: icaoType,
    messageData: JSON.stringify(translatedData),
    uniqueProofId,
  });

  await document.sign(conf.keySecret);
  return document;
}
