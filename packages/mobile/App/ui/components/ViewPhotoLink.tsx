import React, { useCallback, useState } from 'react';
import { Dimensions, View, Alert, TouchableOpacity } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import CameraRoll from '@react-native-community/cameraroll';
import Modal from 'react-native-modal';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { useBackend } from '~/ui/hooks';
import { theme } from '/styled/theme';
import { StyledView, StyledText, StyledImage } from '/styled/common';
import { imageToBase64URI } from '/helpers/image';
import { saveFileInDocuments, deleteFileInDocuments } from '/helpers/file';
import { BaseInputProps } from '../interfaces/BaseInputProps';

export interface ViewPhotoLinkProps extends BaseInputProps {
  imageId: string;
}

const MODAL_HEIGHT = Dimensions.get('window').width * 0.6;

const Message = ({ color, message }): JSX.Element => (
  <StyledView background="white" justifyContent="center" height={MODAL_HEIGHT}>
    <StyledText margin="0 auto" color={color} fontSize={15}>
      {message}
    </StyledText>
  </StyledView>
);

export const ViewPhotoLink = React.memo(({ imageId }: ViewPhotoLinkProps) => {
  const [showModal, setShowModal] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { centralServer, models } = useBackend();
  const netInfo = useNetInfo();
  const openModalCallback = useCallback(async () => {
    setLoading(true);
    setShowModal(true);
    const image = await models.Attachment.findOne({ id: imageId });
    // Use local image if it still exist locally and has not been synced up
    if (image) {
      const localImageData = image.data.toString('base64');
      setImageData(localImageData);
      setLoading(false);
      setErrorMessage(null);
      return;
    }

    if (!netInfo.isInternetReachable) {
      setImageData(null);
      setLoading(false);
      setErrorMessage(
        'You do not currently have an internet connection.\n Images require live internet for viewing.',
      );
      return;
    }

    try {
      const { data } = await centralServer.get(`attachment/${imageId}`, {
        base64: true,
      });
      setImageData(data);
      setLoading(false);
      setErrorMessage(null);
    } catch (error) {
      setImageData(null);
      setLoading(false);
      setErrorMessage(error.message);
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
        <StyledText
          fontWeight="bold"
          color={theme.colors.BRIGHT_BLUE}
          fontSize={18}
        >
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
        {errorMessage && (
          <Message color={theme.colors.ALERT} message={errorMessage} />
        )}
        {loading && (
          <Message
            color={theme.colors.BRIGHT_BLUE}
            message="Loading image..."
          />
        )}
        <FlashMessage position="top" />
      </Modal>
    </View>
  );
});
