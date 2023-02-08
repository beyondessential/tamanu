import ImagePicker, { ImagePickerResponse } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import { check, PERMISSIONS, request } from 'react-native-permissions';

/**
 * @see https://github.com/bamlab/react-native-image-resizer#api
 */
interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  compressFormat?: 'JPEG' | 'PNG' | 'WEBP';
  quality?: number;
  rotation?: number;
  outputPath?: string;
  keepMeta?: boolean;
  mode?: 'contain' | 'cover' | 'stretch';
  onlyScaleDown?: boolean;
}

export const launchImagePicker = (): Promise<ImagePickerResponse | null> =>
  new Promise((resolve, reject) => {
    ImagePicker.showImagePicker(
      {
        title: 'Select Photo',
        // work around for image-picker bug when taking photo:
        //https://github.com/react-native-image-picker/react-native-image-picker/issues/655
        rotation: 360
      },
      imagePickerResponse => {
        if (imagePickerResponse.error) {
          // Add log later
          reject(new Error(imagePickerResponse.error));
        } else if (imagePickerResponse.didCancel) {
          resolve(null);
        } else {
          resolve(imagePickerResponse);
        }
      }
    );
  });

export const getImageFromPhotoLibrary = async () => {
  let image : ImagePickerResponse = null;

  try {
    const photoLibraryPermissionAndroid = await check(
      PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
    );
    if (photoLibraryPermissionAndroid !== 'granted') {
      const photoLibraryPermissionRequest = await request(
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
      );
      if (photoLibraryPermissionRequest === 'granted') {
        image = await launchImagePicker();
        console.log('loaded');
        return image;
      }
    } else {
      image = await launchImagePicker();
      return image;
    }
  } catch (error) {
    throw new Error(error);
  }

  return image;
};

export const imageToBase64URI = (image: string): string =>
  `data:image/jpeg;base64, ${image}`;

export const resizeImage = (path: string, options: ResizeOptions) => {
  const {
    maxWidth,
    maxHeight,
    compressFormat = 'JPEG',
    quality = 100,
    rotation,
    outputPath,
    keepMeta,
    mode,
    onlyScaleDown = true
  } = options;

  return ImageResizer.createResizedImage(
    path,
    maxWidth,
    maxHeight,
    compressFormat,
    quality,
    rotation,
    outputPath,
    keepMeta,
    { mode, onlyScaleDown }
  );
};
