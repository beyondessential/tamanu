import React, { useCallback, useState } from 'react';
import { Dimensions, View } from 'react-native';
import Modal from 'react-native-modal';
import { useNetInfo } from '@react-native-community/netinfo';
import { TouchableOpacity } from 'react-native';
import { useBackend } from '~/ui/hooks';
import { theme } from '/styled/theme';
import { StyledView, StyledText, StyledImage } from '/styled/common';
import { imageToBase64URI } from '/helpers/image';
import { BaseInputProps } from '../interfaces/BaseInputProps';

export interface ViewPhotoLinkProps extends BaseInputProps {
  imageId: string;
}

const MODAL_HEIGHT = Dimensions.get('window').width * 0.6;

const Message = ({ color, message }) => (
  <StyledView background='white' justifyContent='center' height={MODAL_HEIGHT}>
    <StyledText margin='0 auto' color={color} fontSize={15}>
      {message}
    </StyledText>
  </StyledView>
);

export const ViewPhotoLink = React.memo(({ imageId }: ViewPhotoLinkProps) => {
  const [showModal, setShowModal] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { syncSource, models } = useBackend();
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
        'You do not currently have an internet connection.\n Images require live internet for viewing.'
      );
      return;
    }

    try {
      const { data } = await syncSource.get(`attachment/${imageId}`, {
        base64: true
      });
      setImageData(data);
      setLoading(false);
      setErrorMessage(null);
    } catch (error) {
      setImageData(null);
      setErrorMessage(error.errorMessage);
    }
  }, [netInfo]);

  const closeModalCallback = useCallback(async () => {
    setShowModal(false);
    setImageData(null);
    setErrorMessage(null);
  }, []);

  return (
    <View>
      <TouchableOpacity onPress={openModalCallback}>
        <StyledText
          fontWeight='bold'
          color={theme.colors.BRIGHT_BLUE}
          fontSize={18}
        >
          View Image
        </StyledText>
      </TouchableOpacity>
      <Modal isVisible={showModal} onBackdropPress={closeModalCallback}>
        {imageData && (
          <StyledImage
            textAlign='center'
            height={MODAL_HEIGHT}
            source={{ uri: imageToBase64URI(imageData) }}
            resizeMode='cover'
          />
        )}
        {errorMessage && (
          <Message color={theme.colors.ALERT} message={errorMessage} />
        )}
        {loading && (
          <Message
            color={theme.colors.BRIGHT_BLUE}
            message='Loading image...'
          />
        )}
      </Modal>
    </View>
  );
});
