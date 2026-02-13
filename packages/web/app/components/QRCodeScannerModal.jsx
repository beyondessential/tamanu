import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Button, TranslatedText, useSettings } from '@tamanu/ui-components';
import { WebcamCaptureModal, CAMERA_STATUS } from './WebcamCaptureModal';
import { notifyError } from '../utils/index.js';

const MAX_QR_LENGTH = 50;

const normalizeQrValue = value => (typeof value === 'string' ? value.trim() : '');

const useDisplayIdValidation = () => {
  const { getSetting } = useSettings();
  const pattern = getSetting('fields.displayId.pattern');

  const compiledRegex = useMemo(() => {
    if (!pattern) return null;

    try {
      return new RegExp(pattern);
    } catch (e) {
      console.warn('Invalid displayId regex pattern from settings', e);
      return null;
    }
  }, [pattern]);

  return value => {
    if (!value || value.length > MAX_QR_LENGTH) return false;

    // No pattern configured: allow any non-empty value within length bound
    if (!pattern) return true;

    // Pattern configured but invalid
    if (!compiledRegex) return false;

    return compiledRegex.test(value);
  };
};

export const QRCodeScannerModal = ({ open, onClose, onScan }) => {
  const webcamRef = useRef(null);
  const validateCode = useDisplayIdValidation();
  const [cameraStatus, setCameraStatus] = useState(CAMERA_STATUS.REQUESTING);
  const scannerTimerRef = useRef(null);

  useEffect(() => {
    if (cameraStatus === CAMERA_STATUS.READY && open) {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });

      const stopScanning = () => {
        if (scannerTimerRef.current) {
          clearInterval(scannerTimerRef.current);
          scannerTimerRef.current = null;
        }
      };

      const scan = async () => {
        if (webcamRef.current && webcamRef.current.video) {
          const video = webcamRef.current.video;
          // Ensure video is ready to be scanned
          if (video.readyState === 4 && video.videoWidth > 0) {
            try {
              const barcodes = await barcodeDetector.detect(video);
              if (barcodes.length > 0) {
                const rawValue = barcodes[0]?.rawValue;
                const normalizedValue = normalizeQrValue(rawValue);

                stopScanning();

                if (validateCode(normalizedValue)) {
                  onScan?.(normalizedValue);
                } else {
                  notifyError(
                    <TranslatedText
                      stringId="modal.qrScanner.invalidCodeErrorMessage"
                      fallback="Not a valid QR Code"
                    />,
                  );
                }

                onClose();
              }
            } catch (e) {
              // Ignore InvalidStateError during initialization as it's transient
              if (e.name !== 'InvalidStateError') {
                console.error('Barcode detection failed', e);
              }
            }
          }
        }
      };

      scannerTimerRef.current = setInterval(scan, 500); // Scan every 500ms

      return stopScanning;
    }

    return () => {
      if (scannerTimerRef.current) {
        clearInterval(scannerTimerRef.current);
        scannerTimerRef.current = null;
      }
    };
  }, [cameraStatus, open, onScan, onClose, validateCode]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'environment',
  };

  const actions = (
    <Button onClick={onClose} variant="contained" color="primary">
      <TranslatedText stringId="general.action.close" fallback="Close" />
    </Button>
  );

  return (
    <WebcamCaptureModal
      open={open}
      onClose={onClose}
      title={<TranslatedText stringId="modal.qrScanner.title" fallback="Scan QR code" />}
      actions={actions}
      videoConstraints={videoConstraints}
      mirrored={false}
      onCameraStatusChange={setCameraStatus}
      webcamRef={webcamRef}
      requireBarcodeDetector={true}
    />
  );
};
