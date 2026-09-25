import CameraRoll from '@react-native-camera-roll/camera-roll';
import { useNetInfo } from '@react-native-community/netinfo';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, ToastAndroid, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { useBackend } from '~/ui/hooks';
import type { BaseInputProps } from '../interfaces/BaseInputProps';
import { deleteFileInDocuments, saveFileInDocuments } from '/helpers/file';
import { imageToBase64URI } from '/helpers/image';
import { StyledImage, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

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
  const { centralServer, models } = useBackend();
  const netInfo = useNetInfo();
  const openModalCallback = useCallback(async () => {
    setLoading(true);
    setShowModal(true);
    try {
      const image = await models.Attachment.findOne({ where: { id: imageId } });
      // Use local image if it still exist locally and has not been synced up
      if (image) {
        const localImageData = image.data.toString('base64');
        setImageData(localImageData);
        setErrorMessage(null);
        return;
      }

      if (!netInfo.isInternetReachable) {
        setImageData(null);
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
        setErrorMessage(null);
      } catch (error) {
        setImageData(null);
        setErrorMessage(error.message);
      }
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
            const fileName = `${Date.now()}-image.jpg`;
            const filePath = await saveFileInDocuments(imageData, fileName);
            await CameraRoll.save(`file://${filePath}`, { type: 'photo' });
            await deleteFileInDocuments(fileName);

            ToastAndroid.show('Image saved', ToastAndroid.SHORT);
          },
          style: 'default',
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
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
      </Modal>
    </View>
  );
});
