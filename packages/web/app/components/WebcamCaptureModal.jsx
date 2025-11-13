import React, { useRef, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Webcam from 'react-webcam';
import { Box, Divider } from '@material-ui/core';
import { Button, Modal, TranslatedText, TAMANU_COLORS } from '@tamanu/ui-components';
import { BodyText } from './Typography';

const StyledWebcam = styled(Webcam)`
  width: 100%;
  max-width: 640px;
`;

const CapturedImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const CapturedImage = styled.img`
  width: 100%;
  max-width: 640px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 0px 28px 20px 0;
  flex-wrap: wrap;
`;

const ErrorOverlay = styled.div`
  height: 190px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const WebcamWithOverlay = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const WebcamCaptureModal = ({
  open,
  onClose,
  onCapture,
  title = (
    <TranslatedText
      stringId="general.webcamCapture.modal.title"
      fallback="Take Photo with Camera"
    />
  ),
}) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  };

  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
    setIsLoading(false);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback(error => {
    setHasPermission(false);
    setIsLoading(false);
    setError(error.message || 'Failed to access camera');
  }, []);

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
    setError(null);
    setHasPermission(null);
    setIsLoading(true);
    onClose();
  }, [onClose]);

  // Monitor video element events to detect when stream becomes active
  // This provides a fallback if onUserMedia callback doesn't fire
  useEffect(() => {
    if (!open || !isLoading) return;

    const video = webcamRef.current?.video;
    if (!video) return;

    const handleStreamActive = () => {
      // Stream is active, permission was granted
      // Only update if we're still in loading state (callbacks might not have fired)
      if (hasPermission === null) {
        setHasPermission(true);
        setIsLoading(false);
      }
    };

    // Listen to video events that indicate stream is active
    video.addEventListener('loadedmetadata', handleStreamActive);
    video.addEventListener('playing', handleStreamActive);

    // Also check if stream is already active (in case events already fired)
    const stream = video.srcObject;
    if (stream && stream.active) {
      handleStreamActive();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleStreamActive);
      video.removeEventListener('playing', handleStreamActive);
    };
  }, [open, isLoading, hasPermission]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCapturedImage(null);
      setError(null);
      setHasPermission(null);
      setIsLoading(true);
    }
  }, [open]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage && onCapture) {
      // Convert base64 to File object with a proper filename
      const byteString = atob(capturedImage.split(',')[1]);
      const mimeString = capturedImage
        .split(',')[0]
        .split(':')[1]
        .split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // Create a filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `webcam-photo-${timestamp}.jpg`;

      const file = new File([blob], filename, { type: mimeString });
      onCapture(file);
      handleCancel();
    }
  }, [capturedImage, onCapture, handleCancel]);

  const isRequestingPermission = hasPermission === null && isLoading;
  const isCameraAccessDenied = hasPermission === false && !isLoading;
  const isCameraAccessGranted = hasPermission === true && !isLoading;
  const isCameraAccessError = error && !isLoading;

  const renderWebcamView = () => {
    if (isCameraAccessError) {
      return (
        <ErrorOverlay>
          <BodyText>
            <TranslatedText
              stringId="modal.webcamCapture.error.message"
              fallback="Camera access is required to proceed. Please check your browser settings and allow camera access for Tamanu."
            />
          </BodyText>
        </ErrorOverlay>
      );
    }

    // Always render the Webcam component so it can trigger the permission pop-up
    // Show loading overlay while permission is being requested
    return (
      <WebcamWithOverlay>
        <StyledWebcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.8}
          videoConstraints={videoConstraints}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          mirrored={true}
        />
        {isRequestingPermission && (
          <LoadingOverlay>
            <BodyText>
              <TranslatedText
                stringId="modal.webcamCapture.loading.message"
                fallback="When prompted by your system, please allow permission for Tamanu to access the device camera."
              />
            </BodyText>
          </LoadingOverlay>
        )}
      </WebcamWithOverlay>
    );
  };

  const renderCapturedView = () => (
    <CapturedImageContainer>
      <CapturedImage src={capturedImage} alt="Captured photo" />
    </CapturedImageContainer>
  );

  const renderActions = () => {
    if (isCameraAccessDenied) {
      return (
        <>
          <Button onClick={handleCancel} variant="contained" color="primary">
            <TranslatedText stringId="general.action.close" fallback="Close" />
          </Button>
        </>
      );
    }

    if (isCameraAccessGranted) {
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

    return (
      <>
        <Button onClick={handleCancel} variant="outlined" color="primary">
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </Button>
        <Button onClick={capturePhoto} variant="contained" color="primary" disabled>
          <TranslatedText stringId="modal.webcamCapture.action.takePhoto" fallback="Take Photo" />
        </Button>
      </>
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={title}
      width="md"
      actions={<ActionButtons>{renderActions()}</ActionButtons>}
      isClosable={true}
    >
      <Box>{capturedImage ? renderCapturedView() : renderWebcamView()}</Box>
      <Divider
        style={{
          position: 'relative',
          top: '4px',
          color: TAMANU_COLORS.outline,
          margin: '0 -32px',
        }}
      />
    </Modal>
  );
};
