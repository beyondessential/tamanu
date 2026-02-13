import React, { useEffect, useState } from 'react';
import Search from '@material-ui/icons/Search';
import { IconButton, InputAdornment } from '@material-ui/core';
import styled from 'styled-components';
import { QrCode } from 'lucide-react';
import { ClearIcon } from '../Icons/ClearIcon';
import { TextInput } from './TextField';
import { Colors } from '../../constants';
import { useTranslation } from '../../contexts/Translation';
import { QRCodeScannerModal } from '../QRCodeScannerModal';
import { ThemedTooltip } from '../Tooltip';

const Icon = styled(InputAdornment)`
  .MuiSvgIcon-root {
    color: ${Colors.softText};
    font-size: 18px;
  }
`;

const StyledTextInput = styled(TextInput)`
  .MuiInputBase-root {
    padding-left: 10px;
  }
  .MuiInputBase-input {
    padding-left: 5px;
  }
`;

const StyledIconButton = styled(IconButton)`
  padding: 5px;
`;

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${Colors.darkText};
`;

// N.B. this is specifically for use within forms, you may also want to use the `SearchInput`
// component for standalone search fields
export const SearchField = props => {
  const {
    field: { value, name, onChange },
    form: { setFieldValue } = {},
  } = props;
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const clearSearch = () => {
    setSearchValue('');
    setFieldValue?.(name, '');
  };

  const handleQRScan = qrValue => {
    setSearchValue(qrValue);
    setFieldValue?.(name, qrValue);
  };

  return (
    <SearchInput
      {...props}
      name={name}
      value={searchValue}
      onChange={onChange}
      onClear={clearSearch}
      onQRScan={handleQRScan}
    />
  );
};

// N.B. this is for standalone use, if you want a search field within a form, use SearchField.jsx
export const SearchInput = props => {
  const { getTranslation } = useTranslation();
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const { label, placeholder, value, onChange, onClear, showQRScanner, onQRScan } = props;

  const handleQRScan = qrValue => {
    onQRScan?.(qrValue);
    // If not used within SearchField, we might need to call onChange manually if passed
    if (!onQRScan && onChange) {
      onChange({ target: { name: props.name, value: qrValue } });
    }
  };

  return (
    <>
      <StyledTextInput
        InputProps={{
          startAdornment: (
            <Icon position="start" data-testid="icon-5uu4">
              <Search data-testid="search-ne6p" />
            </Icon>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {value && (
                <StyledIconButton onClick={onClear} data-testid="stylediconbutton-l48b">
                  <StyledClearIcon data-testid="styledclearicon-ywim" />
                </StyledIconButton>
              )}
              {showQRScanner && (
                <ThemedTooltip title={getTranslation('general.action.scanQRCode', 'Scan QR code')}>
                  <StyledIconButton
                    onClick={() => setQrModalOpen(true)}
                    data-testid="qr-scanner-button"
                  >
                    <QrCode size={18} color={Colors.softText} />
                  </StyledIconButton>
                </ThemedTooltip>
              )}
            </InputAdornment>
          ),
        }}
        {...props}
        placeholder={
          placeholder ?? (label ? getTranslation(label.props.stringId, label.props.fallback) : '')
        }
        value={value}
        onChange={onChange}
      />
      <QRCodeScannerModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onScan={handleQRScan}
      />
    </>
  );
};
