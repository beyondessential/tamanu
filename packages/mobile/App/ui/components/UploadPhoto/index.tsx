import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Text } from 'react-native';
import RNFS from 'react-native-fs';
import { Popup } from 'popup-ui';
import { useNetInfo } from '@react-native-community/netinfo';
import { useMutation } from '@tanstack/react-query';
import { ERROR_TYPE, NotFoundError } from '@tamanu/errors';
import { useBackend } from '~/ui/hooks';
import { StyledImage, StyledView, StyledText } from '/styled/common';
import {
  getImageFromPhotoLibrary,
  getImageFromCamera,
  imageToBase64URI,
  resizeImage,
} from '/helpers/image';
import { deleteFileInDocuments } from '/helpers/file';
import { BlobAwaitingUploadError } from '~/services/blobs';
import type { BackendManager } from '~/services/BackendManager';
import type { BaseInputProps } from '../../interfaces/BaseInputProps';
import { Button } from '~/ui/components/Button';
import { theme } from '~/ui/styled/theme';

const IMAGE_RESIZE_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 20,
};

const IMAGE_SOURCE_TYPES = {
  CAMERA: 'camera',
  LIBRARY: 'library',
};

const AWAITING_UPLOAD_MESSAGE =
  'This image has not finished uploading from the device that captured it.\nTry again later.';

const NOT_ON_DEVICE_MESSAGE =
  'This image is not on this device yet.\nConnect to the internet to fetch it.';

export interface PhotoProps extends BaseInputProps {
  onChange: Function;
  value: string;
}

interface UploadedImageProps {
  imageData: string;
}

interface UploadPhotoComponentProps {
  onPressChoosePhoto: Function;
  onPressTakePhoto: Function;
  onPressRemovePhoto: Function;
  hasPhoto: boolean;
  imageData: string;
  errorMessage?: string;
  loading: boolean;
}

const IMAGE_WIDTH = Dimensions.get('window').width * 0.6;

// One fact, so a read that lands late can be told from the photo the field
// holds now.
interface Photo {
  attachmentId: string | null;
  status: 'empty' | 'loading' | 'ready' | 'unavailable';
  imageData?: string;
  error?: Error;
}

const NO_PHOTO: Photo = { attachmentId: null, status: 'empty' };

const readPhoto = async (
  attachmentId: string,
  { models, blobCache }: Pick<BackendManager, 'models' | 'blobCache'>,
): Promise<Photo> => {
  try {
    const attachment = await models.Attachment.findOne({ where: { id: attachmentId } });
    if (!attachment?.hash) {
      throw new NotFoundError(`This device holds no record for attachment ${attachmentId}`);
    }
    return {
      attachmentId,
      status: 'ready',
      imageData: await blobCache.readBase64(attachment.hash),
    };
  } catch (error) {
    return { attachmentId, status: 'unavailable', error };
  }
};

const photoMessage = (
  { attachmentId, error }: Photo,
  isInternetReachable: boolean,
): string | null => {
  if (!error) {
    return null;
  }
  if (!attachmentId) {
    // Nothing attached, so the failure came from a capture rather than a read.
    return `Error loading image: ${error.message}`;
  }
  // spec: MOB, XFER — an existing file awaiting its content, with the
  // awaiting-upload and awaiting-fetch cases distinguished
  if (error instanceof BlobAwaitingUploadError) {
    return AWAITING_UPLOAD_MESSAGE;
  }
  if (error instanceof NotFoundError || !isInternetReachable) {
    return NOT_ON_DEVICE_MESSAGE;
  }
  return `Error loading image: ${error.message}`;
};

const ImageActionButton = ({ onPress, label, marginTop = 5, border = true }) => (
  <Button
    buttonText={label}
    onPress={onPress}
    textColor={theme.colors.PRIMARY_MAIN}
    borderColor={theme.colors.PRIMARY_MAIN}
    backgroundColor="transparent"
    margin={5}
    marginTop={marginTop}
    marginBottom={0}
    borderWidth={border ? 1 : 0}
  />
);

const UploadedImage = ({ imageData }: UploadedImageProps) => (
  <StyledView justifyContent="center" alignItems="center">
    <StyledImage
      width="100%"
      height={IMAGE_WIDTH}
      source={{ uri: imageToBase64URI(imageData) }}
      resizeMode="cover"
    />
  </StyledView>
);

const LoadingPlaceholder = () => (
  <StyledView justifyContent="center" alignItems="center" width="100%" height={IMAGE_WIDTH}>
    <Text>Loading image...</Text>
  </StyledView>
);

const UploadPhotoComponent = ({
  onPressChoosePhoto,
  onPressTakePhoto,
  onPressRemovePhoto,
  hasPhoto,
  imageData,
  errorMessage,
  loading,
}: UploadPhotoComponentProps) => (
  <StyledView marginTop={5}>
    {loading && <LoadingPlaceholder />}
    {imageData && <UploadedImage imageData={imageData} />}
    {!imageData && errorMessage && <Text>{errorMessage}</Text>}
    <StyledText fontWeight="500" color={theme.colors.TEXT_SUPER_DARK} marginTop={10}>
      {hasPhoto ? 'Change photo' : 'Upload photo'}
    </StyledText>
    <StyledView justifyContent="space-between" marginLeft={-10}>
      <ImageActionButton onPress={onPressChoosePhoto} label="Choose photo from library" />
      <ImageActionButton onPress={onPressTakePhoto} label="Take photo with camera" />
      {hasPhoto && (
        <ImageActionButton
          onPress={onPressRemovePhoto}
          label="Remove photo"
          border={false}
          marginTop={-3}
        />
      )}
    </StyledView>
  </StyledView>
);

export const UploadPhoto = React.memo(({ onChange, value }: PhotoProps) => {
  const [photo, setPhoto] = useState<Photo>(() =>
    value ? { attachmentId: value, status: 'loading' } : NO_PHOTO,
  );
  const { models, blobCache } = useBackend();
  const { isInternetReachable } = useNetInfo();

  // No queries read attachments from the local database (they're synced up and
  // deleted), so these mutations have nothing to invalidate.
  const { mutateAsync: deleteAttachment } = useMutation({
    mutationFn: (attachmentId: string) => models.Attachment.delete(attachmentId),
  });
  const { mutateAsync: createAttachment } = useMutation({
    mutationFn: ({ hash, size }: { hash: string; size: number }) =>
      models.Attachment.createAndSaveOne({
        hash,
        size,
        type: 'image/jpeg',
      }),
  });

  const removeAttachment = useCallback(
    async value => {
      if (!value) {
        return;
      }
      const attachment = await models.Attachment.findOne({ where: { id: value } });
      if (!attachment) {
        return;
      }
      await deleteAttachment(value);
      // A removed draft photo's blob has no referencing record left, so it can
      // never become eligible for push; demote it to reclaimable cache.
      if (attachment.hash) {
        const stillReferenced = await models.Attachment.findOne({
          where: { hash: attachment.hash },
        });
        if (!stillReferenced) {
          await blobCache.demote(attachment.hash);
        }
      }
    },
    [deleteAttachment],
  );

  const removePhotoCallback = useCallback(async () => {
    onChange(null);
    setPhoto(NO_PHOTO);
    await removeAttachment(value);
  }, [value]);

  useEffect(() => {
    setPhoto(current => {
      if (current.attachmentId === value) {
        return current;
      }
      return value ? { attachmentId: value, status: 'loading' } : NO_PHOTO;
    });
  }, [value]);

  // spec: MOB
  // A photo the answer already holds resolves through its record's hash:
  // content the device holds reads without connectivity, content it does not
  // hold is fetched by hash.
  useEffect(() => {
    const { attachmentId, status } = photo;
    if (status !== 'loading' || !attachmentId) {
      return;
    }
    (async (): Promise<void> => {
      const read = await readPhoto(attachmentId, { models, blobCache });
      // A capture or removal that lands first owns the field; this read is stale.
      setPhoto(current =>
        current.attachmentId === attachmentId && current.status === 'loading' ? read : current,
      );
    })();
  }, [photo, models, blobCache]);

  // spec: MOB — content the device could not fetch is retried once it has
  // connectivity, so the advice to connect is one the component can act on.
  useEffect(() => {
    if (!isInternetReachable) {
      return;
    }
    setPhoto(current =>
      current.status === 'unavailable'
        ? { attachmentId: current.attachmentId, status: 'loading' }
        : current,
    );
  }, [isInternetReachable]);

  const addPhotoCallback = useCallback(
    async imageType => {
      let image: { base64: string; uri: string };
      try {
        if (imageType === IMAGE_SOURCE_TYPES.CAMERA) image = await getImageFromCamera();
        if (imageType === IMAGE_SOURCE_TYPES.LIBRARY) image = await getImageFromPhotoLibrary();
        if (!image) {
          // in case user cancel selecting image
          return;
        }
      } catch (error) {
        await removePhotoCallback();
        setPhoto({ ...NO_PHOTO, error });
        return;
      }

      setPhoto({ attachmentId: null, status: 'loading' });

      // image-picker produces quite expensive files so
      // always delete them straight away to save storage
      await deleteFileInDocuments(image.uri.replace('file://', ''));

      // Remove previous photo when selecting a new photo
      await removeAttachment(value);

      const { path } = await resizeImage(imageToBase64URI(image.base64), {
        outputPath: RNFS.DocumentDirectoryPath,
        rotation: 0,
        ...IMAGE_RESIZE_OPTIONS,
      });

      // spec: MOB
      // The photo is admitted to the device's blob store at the outbox tier and
      // the record carries only its hash. Capture completes without
      // connectivity: the central server's own capacity governs the blob when
      // it is pushed, not at capture.
      let putResult;
      try {
        putResult = await blobCache.putOutbox(path);
      } catch (error) {
        setPhoto(NO_PHOTO);
        await deleteFileInDocuments(path);
        if (error?.type === ERROR_TYPE.STORAGE_INSUFFICIENT) {
          // spec: CAP — the refusal names the device's storage as the cause
          Popup.show({
            type: 'Warning',
            title: 'Not enough storage space on this device',
            textBody:
              'This device is running out of storage space, so the photo cannot be saved. Free up space on the device and try again.',
            callback: (): void => Popup.hide(),
          });
          return;
        }
        setPhoto({ ...NO_PHOTO, error });
        return;
      }

      const { id } = await createAttachment({ hash: putResult.hash, size: putResult.size });

      onChange(id);
      setPhoto({ attachmentId: id, status: 'ready', imageData: image.base64 });
    },
    [value],
  );

  return (
    <UploadPhotoComponent
      hasPhoto={Boolean(photo.attachmentId)}
      imageData={photo.imageData}
      errorMessage={photoMessage(photo, isInternetReachable)}
      onPressTakePhoto={() => addPhotoCallback(IMAGE_SOURCE_TYPES.CAMERA)}
      onPressChoosePhoto={() => addPhotoCallback(IMAGE_SOURCE_TYPES.LIBRARY)}
      onPressRemovePhoto={removePhotoCallback}
      loading={photo.status === 'loading'}
    />
  );
});
