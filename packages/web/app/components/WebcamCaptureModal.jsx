import React, { useRef, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Webcam from 'react-webcam';
import { Box, Divider } from '@material-ui/core';
import { Button, Modal, TranslatedText, TAMANU_COLORS } from '@tamanu/ui-components';
import { BodyText } from './Typography';
import { Loader } from 'lucide-react';

const CAMERA_STATUS = {
  REQUESTING: 'requesting',
  GRANTED: 'granted',
  READY: 'ready',
  DENIED: 'denied',
};

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
}) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraStatus, setCameraStatus] = useState(CAMERA_STATUS.REQUESTING);

  const handleUserMedia = useCallback(() => {
    setCameraStatus(CAMERA_STATUS.READY);
  }, []);

  const handleUserMediaError = useCallback(() => {
    setCameraStatus(CAMERA_STATUS.DENIED);
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
    onClose();
  }, [onClose]);

  // Check camera permissions and monitor video stream status
  useEffect(() => {
    if (!open) return;

    // Reset state when modal opens
    setCapturedImage(null);
    setCameraStatus(CAMERA_STATUS.REQUESTING);

    // Check permission status using Permissions API
    const checkPermission = async () => {
      if (navigator.permissions?.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });

        if (permissionStatus.state === CAMERA_STATUS.DENIED) {
          setCameraStatus(CAMERA_STATUS.DENIED);
        } else if (permissionStatus.state === CAMERA_STATUS.GRANTED) {
          setCameraStatus(CAMERA_STATUS.GRANTED);
        }
      }
    };

    checkPermission();

    // Monitor video element to detect when stream becomes active
    const video = webcamRef.current?.video;
    if (!video) return;

    const handleStreamReady = () => {
      if (video.readyState >= 2) {
        // HAVE_CURRENT_DATA or better
        setCameraStatus(CAMERA_STATUS.READY);
      }
    };

    video.addEventListener('loadedmetadata', handleStreamReady);
    video.addEventListener('canplay', handleStreamReady);

    return () => {
      video.removeEventListener('loadedmetadata', handleStreamReady);
      video.removeEventListener('canplay', handleStreamReady);
    };
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
    if (cameraStatus === CAMERA_STATUS.DENIED) {
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
        {cameraStatus === CAMERA_STATUS.REQUESTING && (
          <LoadingOverlay>
            <BodyText>
              <TranslatedText
                stringId="modal.webcamCapture.loading.message"
                fallback="When prompted by your system, please allow permission for Tamanu to access the device camera."
              />
            </BodyText>
          </LoadingOverlay>
        )}
        {cameraStatus === CAMERA_STATUS.GRANTED && (
          <LoadingOverlay>
            <Loader />
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

  const getModalTitle = () => {
    if (cameraStatus === CAMERA_STATUS.REQUESTING) {
      return (
        <TranslatedText
          stringId="modal.webcamCapture.title.allowAccess"
          fallback="Allow camera access"
        />
      );
    }
    if (cameraStatus === CAMERA_STATUS.DENIED) {
      return (
        <TranslatedText
          stringId="modal.webcamCapture.title.accessRequired"
          fallback="Camera access required"
        />
      );
    }
    return (
      <TranslatedText
        stringId="modal.webcamCapture.title.capturePhoto"
        fallback="Capture photo"
      />
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={getModalTitle()}
      width="md"
      actions={<ActionButtons>{renderActions()}</ActionButtons>}
      isClosable={true}
    >
      <Box>{capturedImage ? renderCapturedView() : renderWebcamView()}</Box>
      <StyledDivider />
    </Modal>
  );
};
