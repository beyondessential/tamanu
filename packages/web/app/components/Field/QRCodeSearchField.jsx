import React, { useEffect, useState } from 'react';
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
  const {
    field: { value = '', name, onChange: fieldOnChange } = {},
    form: { setFieldValue } = {},
  } = props;

  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commitValue = nextValue => {
    setLocalValue(nextValue);
    setFieldValue?.(name, nextValue);
  };

  const handleChange = e => {
    const nextValue = e?.target?.value ?? '';
    setLocalValue(nextValue);

    // Prefer setFieldValue when present; otherwise fall back to field's onChange
    if (setFieldValue) {
      setFieldValue(name, nextValue);
    } else {
      fieldOnChange?.(e);
    }
  };

  const handleClear = () => {
    commitValue('');
  };

  const handleScan = qrValue => {
    commitValue(qrValue);
  };

  return (
    <QRCodeSearchInput
      {...props}
      name={name}
      value={localValue}
      onChange={handleChange}
      onClear={handleClear}
      onQRScan={handleScan}
    />
  );
};

export const QRCodeSearchInput = ({ value, onChange, name, onQRScan, ...props }) => {
  const { getTranslation } = useTranslation();
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const applyScannedValue = qrValue => {
    if (onQRScan) {
      onQRScan(qrValue);
      return;
    }

    if (onChange) {
      onChange({ target: { name, value: qrValue } });
    }
  };

  return (
    <Container>
      <SearchInput {...props} name={name} value={value} onChange={onChange} />
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
