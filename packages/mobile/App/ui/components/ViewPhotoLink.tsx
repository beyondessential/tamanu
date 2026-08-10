import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, TouchableOpacity, View } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import CameraRoll from '@react-native-camera-roll/camera-roll';
import Modal from 'react-native-modal';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { useBackend } from '~/ui/hooks';
import { theme } from '/styled/theme';
import { StyledImage, StyledText, StyledView } from '/styled/common';
import { imageToBase64URI } from '/helpers/image';
import { deleteFileInDocuments, saveFileInDocuments } from '/helpers/file';
import { BlobAwaitingUploadError } from '~/services/blobs';
import { BaseInputProps } from '../interfaces/BaseInputProps';

export interface ViewPhotoLinkProps extends BaseInputProps {
  imageId: string;
}

const MODAL_HEIGHT = Dimensions.get('window').width * 0.6;

const Message = ({ color, message }): JSX.Element => (
  <StyledView background="white" justifyContent="center" height={MODAL_HEIGHT}>
    <StyledText
      marginTop={0}
      marginBottom={0}
      marginLeft="auto"
      marginRight="auto"
      color={color}
      fontSize={15}
    >
      {message}
    </StyledText>
  </StyledView>
);

export const ViewPhotoLink = React.memo(({ imageId }: ViewPhotoLinkProps) => {
  const [showModal, setShowModal] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { centralServer, models, blobCache } = useBackend();
  const netInfo = useNetInfo();
  const openModalCallback = useCallback(async () => {
    setLoading(true);
    setShowModal(true);
    setImageData(null);
    setErrorMessage(null);

    try {
      const attachment = await models.Attachment.findOne({ where: { id: imageId } });

      if (attachment?.hash) {
        // spec: MOB
        // The read resolves the record's hash against the device's blob store.
        // Content the device holds displays without connectivity; content it
        // does not hold is fetched by hash and admitted to the cache, so a
        // later read needs no connectivity.
        try {
          setImageData(await blobCache.readBase64(attachment.hash));
          return;
        } catch (error) {
          // spec: MOB, XFER — an existing file awaiting its content, with the
          // awaiting-upload and awaiting-fetch cases distinguished
          if (error instanceof BlobAwaitingUploadError) {
            setErrorMessage(
              'This image has not finished uploading from the device that captured it.\nTry again later.',
            );
          } else if (!netInfo.isInternetReachable) {
            setErrorMessage(
              'This image is not on this device yet.\nConnect to the internet to fetch it.',
            );
          } else {
            setErrorMessage(error.message);
          }
          return;
        }
      }

      // No hash: a legacy attachment served from the central server by id, or
      // a record this device does not hold at all. Both need live internet.
      if (!netInfo.isInternetReachable) {
        setErrorMessage(
          'You do not currently have an internet connection.\n Images require live internet for viewing.',
        );
        return;
      }

      const response = await centralServer.get<{ data?: string }>(`attachment/${imageId}`, {
        base64: true,
      });
      if (response?.data) {
        setImageData(response.data);
      } else {
        // Central holds the record but its bytes have not arrived there yet.
        setErrorMessage(
          'This image has not finished uploading from the device that captured it.\nTry again later.',
        );
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [netInfo]);

  const closeModalCallback = useCallback(async () => {
    setShowModal(false);
    setImageData(null);
    setErrorMessage(null);
  }, []);

  const imagePressCallback = useCallback(async () => {
    Alert.alert(
      'Save image',
      'Save image to Camera Roll?',
      [
        {
          text: 'Save',
          onPress: async (): Promise<void> => {
            const time = new Date().getTime();
            const fileName = `${time}-image.jpg`;
            const filePath = await saveFileInDocuments(imageData, fileName);
            await CameraRoll.save(`file://${filePath}`, {
              type: 'photo',
            });
            await deleteFileInDocuments(fileName);

            showMessage({
              message: 'Image saved',
              type: 'default',
              backgroundColor: theme.colors.BRIGHT_BLUE,
            });
          },
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {
        cancelable: true,
      },
    );
  }, [imageData]);
  return (
    <View>
      <TouchableOpacity onPress={openModalCallback}>
        <StyledText fontWeight="bold" color={theme.colors.BRIGHT_BLUE} fontSize={18}>
          View Image
        </StyledText>
      </TouchableOpacity>
      <Modal isVisible={showModal} onBackdropPress={closeModalCallback}>
        {imageData && (
          <TouchableOpacity onLongPress={imagePressCallback}>
            <StyledImage
              textAlign="center"
              height={MODAL_HEIGHT}
              source={{ uri: imageToBase64URI(imageData) }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        {errorMessage && <Message color={theme.colors.ALERT} message={errorMessage} />}
        {loading && <Message color={theme.colors.BRIGHT_BLUE} message="Loading image..." />}
        <FlashMessage position="top" />
      </Modal>
    </View>
  );
});
