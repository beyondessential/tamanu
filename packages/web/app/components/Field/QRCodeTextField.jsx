import React from 'react';
import styled from 'styled-components';
import { QRCodeIconButton, QRCodeScanButton } from './QRCodeScanButton';
import { TextField } from './TextField';

const Container = styled.div`
  display: flex;
  align-items: flex-end;

  > div {
    flex: 1;
  }
`;

const TextFieldIconButton = styled(QRCodeIconButton)`
  height: 44px;
  width: 44px;
`;

export const QRCodeTextField = ({ matchDisplayIdPattern, ...props }) => {
  const { field: { name } = {}, form: { setFieldValue } = {} } = props;

  return (
    <Container>
      <TextField {...props} />
      <QRCodeScanButton
        name={name}
        onScan={qrCodeValue => setFieldValue(name, qrCodeValue)}
        matchDisplayIdPattern={matchDisplayIdPattern}
        component={TextFieldIconButton}
      />
    </Container>
  );
};
