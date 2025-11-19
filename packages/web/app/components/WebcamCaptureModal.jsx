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

const StyledDivider = styled(Divider)`
  position: relative;
  top: 4px;
  color: ${TAMANU_COLORS.outline};
  margin: 0 -32px;
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
  const [isLoading, setIsLoading] = useState(true);

  const isRequestingPermission = hasPermission === null && isLoading;
  const isCameraAccessDenied = hasPermission === false && !isLoading;
  const isCameraAccessGranted = hasPermission === true && !isLoading;

  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
    setIsLoading(false);
  }, []);

  const handleUserMediaError = useCallback(() => {
    setHasPermission(false);
    setIsLoading(false);
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
      setHasPermission(null);
      setIsLoading(true);
    }
  }, [open]);

  const confirmPhoto = useCallback(async () => {
    if (capturedImage && onCapture) {
      // Convert base64 to File object with a proper filename
      const blob = await fetch(capturedImage).then(res => res.blob());

      // Create a filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `webcam-photo-${timestamp}.jpg`;

      const file = new File([blob], filename, { type: blob.type });
      onCapture(file);
      handleCancel();
    }
  }, [capturedImage, onCapture, handleCancel]);

  const renderWebcamView = () => {
    if (isCameraAccessDenied) {
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
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: 'user',
          }}
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
      if (capturedImage) {
        // Show Cancel, Retake, and Confirm when there's a captured image
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
      // Show Cancel and Take Photo when camera is granted but no photo taken yet
      return (
        <>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
          </Button>
          <Button onClick={capturePhoto} variant="contained" color="primary">
            <TranslatedText stringId="modal.webcamCapture.action.takePhoto" fallback="Take Photo" />
          </Button>
        </>
      );
    }

    return (
      <>
        <Button onClick={handleCancel} variant="outlined" color="primary">
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </Button>
        <Button variant="contained" color="primary" disabled>
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
      <StyledDivider/>
    </Modal>
  );
};
