import React, { useRef, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Webcam from 'react-webcam';
import { Box, Typography } from '@material-ui/core';
import { Button } from './Button';
import { Modal } from './Modal';
import { TranslatedText } from './Translation';
import { TAMANU_COLORS } from '../constants';

const StyledWebcam = styled(Webcam)`
  width: 100%;
  max-width: 640px;
  border-radius: 8px;
  border: 2px solid ${TAMANU_COLORS.softOutline};
`;

const CapturedImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const CapturedImage = styled.img`
  width: 100%;
  max-width: 640px;
  border-radius: 8px;
  border: 2px solid ${TAMANU_COLORS.softOutline};
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 20px 0;
  flex-wrap: wrap;
`;

const ErrorMessage = styled.div`
  color: ${TAMANU_COLORS.alert};
  text-align: center;
  margin: 20px 0;
  padding: 16px;
  background-color: ${TAMANU_COLORS.veryLightBlue};
  border-radius: 4px;
  border: 1px solid ${TAMANU_COLORS.softOutline};
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
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  z-index: 10;
  padding: 24px;
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

  const handleUserMediaError = useCallback((error) => {
    console.error('Webcam access error:', error);
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
      const mimeString = capturedImage.split(',')[0].split(':')[1].split(';')[0];
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

  const renderWebcamView = () => {
    if (error || (hasPermission === false && !isLoading)) {
      return (
        <ErrorMessage>
          <Typography variant="h6" component="div">
            <TranslatedText
              stringId="general.webcamCapture.error.title"
              fallback="Camera Access Required"
            />
          </Typography>
          <Typography variant="body2" style={{ marginTop: '8px' }}>
            <TranslatedText
              stringId="general.webcamCapture.error.message"
              fallback="Please allow camera access to take photos. Check your browser settings if the camera permission was denied."
            />
          </Typography>
          {error && (
            <Typography variant="body2" style={{ marginTop: '8px', fontSize: '0.875rem' }}>
              Error: {error}
            </Typography>
          )}
        </ErrorMessage>
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
        {isLoading && (
          <LoadingOverlay>
            <Typography variant="h6" component="div" style={{ marginBottom: '12px' }}>
              <TranslatedText
                stringId="general.webcamCapture.loading"
                fallback="Requesting camera access..."
              />
            </Typography>
            <Typography variant="body2" style={{ color: TAMANU_COLORS.softText, marginTop: '8px' }}>
              Please allow camera access when prompted by your browser
            </Typography>
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
    if (error || !hasPermission) {
      return (
        <ActionButtons>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            <TranslatedText
              stringId="general.action.cancel"
              fallback="Cancel"
            />
          </Button>
        </ActionButtons>
      );
    }

    if (capturedImage) {
      return (
        <ActionButtons>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            <TranslatedText
              stringId="general.action.cancel"
              fallback="Cancel"
            />
          </Button>
          <Button onClick={retakePhoto} variant="outlined" color="primary">
            <TranslatedText
              stringId="general.webcamCapture.action.retake"
              fallback="Retake"
            />
          </Button>
          <Button onClick={confirmPhoto} variant="contained" color="primary">
            <TranslatedText
              stringId="general.webcamCapture.action.confirm"
              fallback="Confirm"
            />
          </Button>
        </ActionButtons>
      );
    }

    return (
      <ActionButtons>
        <Button onClick={handleCancel} variant="outlined" color="primary">
          <TranslatedText
            stringId="general.action.cancel"
            fallback="Cancel"
          />
        </Button>
        {hasPermission && !isLoading && (
          <Button onClick={capturePhoto} variant="contained" color="primary">
            <TranslatedText
              stringId="general.webcamCapture.action.takePhoto"
              fallback="Take Photo"
            />
          </Button>
        )}
      </ActionButtons>
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={title}
      width="md"
      actions={renderActions()}
      isClosable={true}
    >
      <Box>
        {capturedImage ? renderCapturedView() : renderWebcamView()}
      </Box>
    </Modal>
  );
};