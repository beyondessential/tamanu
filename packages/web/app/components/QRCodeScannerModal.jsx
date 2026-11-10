import React, { useRef, useState, useEffect } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { parseScannedDisplayId } from '@tamanu/utils/scannedDisplayId';
import { Button, TranslatedText, useSettings } from '@tamanu/ui-components';
import { WebcamCaptureModal, CAMERA_STATUS } from './WebcamCaptureModal';
import { notifyError } from '../utils/index.js';

export const QRCodeScannerModal = ({ open, onClose, onScan }) => {
  const webcamRef = useRef(null);
  const { getSetting } = useSettings();
  const displayIdPattern = getSetting('fields.displayId.pattern');
  const [cameraStatus, setCameraStatus] = useState(CAMERA_STATUS.REQUESTING);
  const scannerTimerRef = useRef(null);

  useEffect(() => {
    if (cameraStatus === CAMERA_STATUS.READY && open) {
      const barcodeDetector =
        'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
      const zxingReader = !barcodeDetector ? new BrowserQRCodeReader() : null;

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
              let rawValue;
              if (barcodeDetector) {
                const barcodes = await barcodeDetector.detect(video);
                if (barcodes.length > 0) {
                  rawValue = barcodes[0]?.rawValue;
                }
              } else if (zxingReader) {
                try {
                  const result = await zxingReader.decodeOnceFromVideoElement(video);
                  rawValue = result?.getText();
                } catch (zxingError) {
                  // zxing throws when no QR code is found in the frame
                }
              }

              if (rawValue) {
                stopScanning();

                const displayId = parseScannedDisplayId(rawValue, displayIdPattern);
                if (displayId) {
                  onScan?.(displayId);
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
  }, [cameraStatus, open, onScan, onClose, displayIdPattern]);

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
      requireBarcodeDetector={false}
    />
  );
};
