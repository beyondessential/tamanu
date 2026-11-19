import React from 'react';
import styled from 'styled-components';
import { QRCodeScanButton } from './QRCodeScanButton';
import { TextField } from './TextField';

const Container = styled.div`
  display: flex;
  align-items: flex-end;

  > div {
    flex: 1;
  }
`;

const ScanButton = styled(QRCodeScanButton)`
  height: 44px;
  width: 44px;
`;

export const QRCodeTextField = ({ matchDisplayIdPattern, ...props }) => {
  const { field: { name } = {}, onChange } = props;

  return (
    <Container>
      <TextField {...props} />
      <ScanButton
        name={name}
        onScan={qrCodeValue => onChange({ target: { name, value: qrCodeValue } })}
        matchDisplayIdPattern={matchDisplayIdPattern}
      />
    </Container>
  );
};
