import React, { useState } from 'react';
import { IconButton } from '@material-ui/core';
import styled from 'styled-components';
import { QRCodeIcon } from '../Icons';
import { useTranslation } from '../../contexts/Translation';
import { QRCodeScannerModal } from '../QRCodeScannerModal';
import { ThemedTooltip } from '../Tooltip';
import { SearchInput } from './SearchField';

const Container = styled.div`
  display: flex;
  align-items: flex-end;

  > div {
    flex: 1;
  }
`;

const StyledIconButton = styled(IconButton)`
  height: 38px;
  width: 38px;
  margin-left: 5px;
  border: 1px solid ${props => props.theme.palette.primary.main};
  color: ${props => props.theme.palette.primary.main};
  border-radius: 3px;
`;

export const QRCodeSearchField = props => {
  const { getTranslation } = useTranslation();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const { field: { onChange, name, value } = {}, form: { setFieldValue } = {} } = props;

  const onClear = () => {
    setFieldValue(name, '');
  };

  const applyScannedValue = qrCodeValue => {
    setFieldValue(name, qrCodeValue);
  };

  return (
    <Container>
      <SearchInput {...props} onChange={onChange} name={name} value={value} onClear={onClear} />
      <ThemedTooltip title={getTranslation('general.action.scanQRCode', 'Scan QR code')}>
        <StyledIconButton onClick={() => setQrModalOpen(true)} data-testid="qr-scanner-button">
          <QRCodeIcon />
        </StyledIconButton>
      </ThemedTooltip>
      <QRCodeScannerModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onScan={applyScannedValue}
      />
    </Container>
  );
};
