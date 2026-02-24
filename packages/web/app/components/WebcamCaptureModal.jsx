import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Webcam from 'react-webcam';
import { Box, Divider } from '@material-ui/core';
import { Modal, TranslatedText, TAMANU_COLORS } from '@tamanu/ui-components';
import { BodyText } from './Typography';
import { Loader } from 'lucide-react';

export const CAMERA_STATUS = {
  REQUESTING: 'requesting',
  GRANTED: 'granted',
  READY: 'ready',
  DENIED: 'denied',
};

const StyledWebcam = styled(Webcam)`
  width: 100%;
  max-width: 640px;
`;

export const ActionButtons = styled.div`
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
  title,
  actions,
  children,
  videoConstraints,
  mirrored = true,
  onCameraStatusChange,
  webcamRef,
  requireBarcodeDetector = false,
}) => {
  const [cameraStatus, setCameraStatus] = useState(CAMERA_STATUS.REQUESTING);

  const handleUserMedia = useCallback(() => {
    setCameraStatus(CAMERA_STATUS.READY);
    onCameraStatusChange?.(CAMERA_STATUS.READY);
  }, [onCameraStatusChange]);

  const handleUserMediaError = useCallback(() => {
    setCameraStatus(CAMERA_STATUS.DENIED);
    onCameraStatusChange?.(CAMERA_STATUS.DENIED);
  }, [onCameraStatusChange]);

  useEffect(() => {
    if (!open) return;
    setCameraStatus(CAMERA_STATUS.REQUESTING);
    onCameraStatusChange?.(CAMERA_STATUS.REQUESTING);

    const checkPermission = async () => {
      if (navigator.permissions?.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' });

          if (permissionStatus.state === CAMERA_STATUS.DENIED) {
            setCameraStatus(CAMERA_STATUS.DENIED);
            onCameraStatusChange?.(CAMERA_STATUS.DENIED);
          } else if (permissionStatus.state === CAMERA_STATUS.GRANTED) {
            setCameraStatus(prevStatus => {
              const nextStatus =
                prevStatus === CAMERA_STATUS.REQUESTING ? CAMERA_STATUS.GRANTED : prevStatus;
              if (nextStatus !== prevStatus) {
                onCameraStatusChange?.(nextStatus);
              }
              return nextStatus;
            });
          }
        } catch (e) {
          console.warn('Camera permission query not supported', e);
        }
      }
    };

    checkPermission();

    const video = webcamRef.current?.video;
    if (!video) return;

    const handleStreamReady = () => {
      if (video.readyState >= 2) {
        setCameraStatus(CAMERA_STATUS.READY);
        onCameraStatusChange?.(CAMERA_STATUS.READY);
      }
    };

    video.addEventListener('loadedmetadata', handleStreamReady);
    video.addEventListener('canplay', handleStreamReady);

    return () => {
      video.removeEventListener('loadedmetadata', handleStreamReady);
      video.removeEventListener('canplay', handleStreamReady);
    };
  }, [open, requireBarcodeDetector, onCameraStatusChange, webcamRef]);

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
          videoConstraints={videoConstraints}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          mirrored={mirrored}
        />
        {(cameraStatus === CAMERA_STATUS.REQUESTING || cameraStatus === CAMERA_STATUS.GRANTED) && (
          <LoadingOverlay>
            {cameraStatus === CAMERA_STATUS.REQUESTING ? (
              <BodyText>
                <TranslatedText
                  stringId="modal.webcamCapture.loading.message"
                  fallback="When prompted by your system, please allow permission for Tamanu to access the device camera."
                />
              </BodyText>
            ) : (
              <Loader />
            )}
          </LoadingOverlay>
        )}
      </WebcamWithOverlay>
    );
  };

  const getEffectiveTitle = () => {
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
    return title;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={getEffectiveTitle()}
      width="md"
      actions={<ActionButtons>{actions}</ActionButtons>}
      isClosable={true}
    >
      <Box>{children || renderWebcamView()}</Box>
      <StyledDivider />
    </Modal>
  );
};
