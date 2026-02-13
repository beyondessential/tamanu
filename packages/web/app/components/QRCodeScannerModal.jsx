import React, { useRef, useState, useEffect } from 'react';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { WebcamCaptureModal, CAMERA_STATUS } from './WebcamCaptureModal.jsx';

export const QRCodeScannerModal = ({ open, onClose, onScan }) => {
  const webcamRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState(CAMERA_STATUS.REQUESTING);
  const scannerTimerRef = useRef(null);

  useEffect(() => {
    if (cameraStatus === CAMERA_STATUS.READY && open) {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });

      const scan = async () => {
        if (webcamRef.current && webcamRef.current.video) {
          const video = webcamRef.current.video;
          // Ensure video is ready to be scanned
          if (video.readyState === 4 && video.videoWidth > 0) {
            try {
              const barcodes = await barcodeDetector.detect(video);
              if (barcodes.length > 0) {
                const qrValue = barcodes[0].rawValue;
                onScan?.(qrValue);
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
    }

    return () => {
      if (scannerTimerRef.current) {
        clearInterval(scannerTimerRef.current);
      }
    };
  }, [cameraStatus, open, onScan, onClose]);

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
