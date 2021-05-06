
import React, { useCallback, useState } from 'react';
import { Dimensions, View, Text } from 'react-native';
import Modal from 'react-native-modal';
import { useNetInfo } from "@react-native-community/netinfo";
import { useBackend } from '~/ui/hooks';
import { theme } from '/styled/theme';
import { StyledView, StyledText, StyledImage } from '/styled/common';
import { imageToBase64URI } from '/helpers/image';
import { BaseInputProps } from '../interfaces/BaseInputProps';

export interface ViewPhotoLinkProps extends BaseInputProps {
  imageId: string;
}

const MODAL_HEIGHT = Dimensions.get('window').width * 0.6;

export const ViewPhotoLink = React.memo(({ imageId }: ViewPhotoLinkProps) => {
  const [showModal, setShowModal] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { syncSource, models } = useBackend();
  const netInfo = useNetInfo();
  const openModalCallback = useCallback(async () => {
    const image = await models.Attachment.findOne({id: imageId});
    // Use local image if it still exist locally and has not been synced up
    if (image) {
      const localImageData = image.data.toString('base64');
      setImageData(localImageData);
      setShowModal(true);
      return;
    }

    if (!netInfo.isInternetReachable) {
      setImageData(null);
      setErrorMessage('You do not currently have an internet connection. Images require live internet for viewing.')
      setShowModal(true);
      return;
    }

    try {
      const { data } = await syncSource.get(`attachment/${imageId}`, { base64: true });
      setImageData(data);
      setErrorMessage(null);
    } catch (error) {
      setImageData(null);
      setErrorMessage(error.message);
    }
      
    setShowModal(true);
  }, []);

  const closeModalCallback = useCallback(async () => {
    setShowModal(false);
    setImageData(null);
    setErrorMessage(null);
  }, []);

  return (
    <View>
      <Text style={{color: 'blue'}} onPress={openModalCallback}>View Image</Text>
      <Modal isVisible={showModal} onBackdropPress={closeModalCallback}>
        {
          imageData && !errorMessage ?
          (
            <StyledImage
              textAlign="center"
              height={MODAL_HEIGHT}
              source={{ uri: imageToBase64URI(imageData)}}
              resizeMode="cover"
            />
          ) :
          (
            <StyledView
              background="white"
              justifyContent="center"
              height={MODAL_HEIGHT}
            >
              <StyledText margin={20} color={theme.colors.ALERT} fontSize={15}>{errorMessage}</StyledText>
            </StyledView>
          )
        }
        
      </Modal>
    </View>
  )
});
