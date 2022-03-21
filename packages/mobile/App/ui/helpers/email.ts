import { Linking } from 'react-native';

export const sendEmail = async (
  emailReceiver: string,
  subject = '',
  body = '',
  ccList = [],
): Promise<any> => {
  const url = `mailto:${emailReceiver}?
  subject=${subject}
  &body=${body}
  &cc=${ccList.map(cc => `${cc},`)}`;

  const canOpen = await Linking.canOpenURL(url);

  if (!canOpen) {
    throw new Error('Provided URL can not be handled');
  }

  return Linking.openURL(url);
};
