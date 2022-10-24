import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Text } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { StyledImage, StyledText, StyledView } from '~/ui/styled/common';

interface Props {
  patientId: string;
}

/**
 * Determine wether patient has the consent to use telegram
 * Then display 
 */

export const QRCodeDisplay: React.FC<Props> = ({ patientId }): JSX.Element => {
  const [qrData, setQrData] = useState<string|null>(null);
  const [qrError, setQrError] = useState<string|null>(null);

  const createPatientQRCode = async (): Promise<void> => {
    try {
      const data = await QRCode.toString(`https://t.me/tamanu_prototype_bot?start=${patientId}`, { type: 'svg' });
      setQrData(data);
    } catch (err) {
      console.log('<<<<<<<', err);
    }
  };

  useEffect(() => {
    createPatientQRCode();
  }, [patientId]);

  return (
    <StyledView paddingTop={10}>
      <SvgXml width={300} height={300} xml={qrData} />
    </StyledView>
  );
};
