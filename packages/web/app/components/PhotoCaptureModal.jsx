import React, { useRef, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { WebcamCaptureModal, CAMERA_STATUS } from './WebcamCaptureModal';

const CapturedImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const CapturedImage = styled.img`
  width: 100%;
  max-width: 640px;
`;

export const PhotoCaptureModal = ({ open, onClose, onCapture }) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraStatus, setCameraStatus] = useState(CAMERA_STATUS.REQUESTING);

  useEffect(() => {
    if (open) {
      setCapturedImage(null);
    }
  }, [open]);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1280,
        height: 720,
        format: 'image/jpeg',
        quality: 0.8,
      });
      setCapturedImage(imageSrc);
    }
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const handleCancel = useCallback(() => {
    setCapturedImage(null);
    onClose();
  }, [onClose]);

  const confirmPhoto = useCallback(async () => {
    if (capturedImage && onCapture) {
      const blob = await fetch(capturedImage).then(res => res.blob());
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `webcam-photo-${timestamp}.jpg`;
      const file = new File([blob], filename, { type: blob.type });
      onCapture(file);
      handleCancel();
    }
  }, [capturedImage, onCapture, handleCancel]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  };

  const renderActions = () => {
    if (cameraStatus === CAMERA_STATUS.DENIED) {
      return (
        <Button onClick={handleCancel} variant="contained" color="primary">
          <TranslatedText stringId="general.action.close" fallback="Close" />
        </Button>
      );
    }

    if (capturedImage) {
      return (
        <>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
          </Button>
          <Button onClick={retakePhoto} variant="outlined" color="primary">
            <TranslatedText stringId="modal.webcamCapture.action.retake" fallback="Retake" />
          </Button>
          <Button onClick={confirmPhoto} variant="contained" color="primary">
            <TranslatedText stringId="modal.webcamCapture.action.confirm" fallback="Confirm" />
          </Button>
        </>
      );
    }

    const isCameraReady = cameraStatus === CAMERA_STATUS.READY;
    return (
      <>
        <Button onClick={handleCancel} variant="outlined" color="primary">
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </Button>
        <Button
          onClick={capturePhoto}
          variant="contained"
          color="primary"
          disabled={!isCameraReady}
        >
          <TranslatedText stringId="modal.webcamCapture.action.takePhoto" fallback="Take Photo" />
        </Button>
      </>
    );
  };

  return (
    <WebcamCaptureModal
      open={open}
      onClose={handleCancel}
      title={
        <TranslatedText
          stringId="modal.webcamCapture.title.capturePhoto"
          fallback="Capture photo"
        />
      }
      actions={renderActions()}
      videoConstraints={videoConstraints}
      onCameraStatusChange={setCameraStatus}
      webcamRef={webcamRef}
    >
      {capturedImage ? (
        <CapturedImageContainer>
          <CapturedImage src={capturedImage} alt="Captured photo" />
        </CapturedImageContainer>
      ) : null}
    </WebcamCaptureModal>
  );
};
