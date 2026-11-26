import React from 'react';
import styled from 'styled-components';
import { QRCodeScanButton } from './QRCodeScanButton';
import { SearchInput } from './SearchField';

const Container = styled.div`
  display: flex;
  align-items: flex-end;

  > div {
    flex: 1;
  }
`;

export const QRCodeSearchField = ({ matchDisplayIdPattern, ...props }) => {
  const { field: { onChange, name, value } = {}, form: { setFieldValue } = {} } = props;

  return (
    <Container>
      <SearchInput
        {...props}
        onChange={onChange}
        name={name}
        value={value}
        onClear={() => setFieldValue(name, '')}
      />
      <QRCodeScanButton
        name={name}
        onScan={qrCodeValue => setFieldValue(name, qrCodeValue)}
        matchDisplayIdPattern={matchDisplayIdPattern}
      />
    </Container>
  );
};
