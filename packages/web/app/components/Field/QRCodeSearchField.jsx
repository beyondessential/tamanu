import React, { useState } from 'react';
import { IconButton } from '@material-ui/core';
import styled from 'styled-components';
import { QRCodeIcon } from '../Icons';
import { useTranslation } from '../../contexts/Translation';
import { QRCodeScannerModal } from '../QRCodeScannerModal';
import { ThemedTooltip } from '../Tooltip';
import { SearchInput } from './SearchField';
import { TextField } from './TextField';

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

const TextFieldIconButton = styled(StyledIconButton)`
  height: 44px;
  width: 44px;
`;

export const QRCodeScanButton = ({
  onScan,
  matchDisplayIdPattern,
  component: Button = StyledIconButton,
  className,
}) => {
  const { getTranslation } = useTranslation();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const label = getTranslation('general.action.scanQRCode', 'Scan QR code');

  return (
    <>
      <ThemedTooltip title={label}>
        <Button
          className={className}
          aria-label={label}
          onClick={() => setQrModalOpen(true)}
          data-testid="qr-scanner-button"
        >
          <QRCodeIcon aria-hidden />
        </Button>
      </ThemedTooltip>
      <QRCodeScannerModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onScan={onScan}
        matchDisplayIdPattern={matchDisplayIdPattern}
      />
    </>
  );
};

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
        onScan={qrCodeValue => setFieldValue(name, qrCodeValue)}
        matchDisplayIdPattern={matchDisplayIdPattern}
      />
    </Container>
  );
};

export const QRCodeTextField = ({ matchDisplayIdPattern, ...props }) => {
  const { field: { name } = {}, form: { setFieldValue } = {} } = props;

  return (
    <Container>
      <TextField {...props} />
      <QRCodeScanButton
        onScan={qrCodeValue => setFieldValue(name, qrCodeValue)}
        matchDisplayIdPattern={matchDisplayIdPattern}
        component={TextFieldIconButton}
      />
    </Container>
  );
};
