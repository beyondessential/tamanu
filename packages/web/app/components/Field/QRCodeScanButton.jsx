import React, { useState } from 'react';
import { IconButton } from '@material-ui/core';
import styled from 'styled-components';
import { QRCodeIcon } from '../Icons';
import { useTranslation } from '../../contexts/Translation';
import { QRCodeScannerModal } from '../QRCodeScannerModal';
import { ThemedTooltip } from '../Tooltip';

export const QRCodeIconButton = styled(IconButton)`
  height: 38px;
  width: 38px;
  margin-left: 5px;
  border: 1px solid ${props => props.theme.palette.primary.main};
  color: ${props => props.theme.palette.primary.main};
  border-radius: 3px;
`;

export const QRCodeScanButton = ({
  name,
  onScan,
  matchDisplayIdPattern,
  component: Button = QRCodeIconButton,
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
          data-testid={`qr-scanner-button-${name}`}
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
