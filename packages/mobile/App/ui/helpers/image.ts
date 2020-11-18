import { Platform } from 'react-native';
import ImagePicker, { ImagePickerResponse } from 'react-native-image-picker';
import { check, PERMISSIONS, request } from 'react-native-permissions';

export const launchImagePicker = (): Promise<ImagePickerResponse> => new Promise((
  resolve, reject,
) => {
  ImagePicker.showImagePicker(
    {
      title: 'Select Profile Photo',
    },
    imagePickerResponse => {
      if (imagePickerResponse.error) {
        // Add log later
        reject(new Error(imagePickerResponse.error));
      } else if (imagePickerResponse.didCancel) {
        resolve();
      } else {
        resolve(imagePickerResponse);
      }
    },
  );
});

export const getImageFromPhotoLibrary = async (): Promise<Nullable<
  ImagePickerResponse
>> => {
  const OS = Platform.OS;
  let image = null;
  if (OS === 'android') {
    try {
      const photoLibraryPermissionAndroid = await check(
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      );
      if (photoLibraryPermissionAndroid !== 'granted') {
        const photoLibraryPermissionRequest = await request(
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
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
  } else {
    try {
      const photoLibraryPermissionIOS = await check(
        PERMISSIONS.IOS.PHOTO_LIBRARY,
      );
      if (photoLibraryPermissionIOS !== 'granted') {
        const photoLibraryPermissionRequest = await request(
          PERMISSIONS.IOS.PHOTO_LIBRARY,
        );
        if (photoLibraryPermissionRequest === 'granted') {
          image = await launchImagePicker();
          return image;
        }
      } else {
        image = await launchImagePicker();
        return image;
      }
    } catch (error) {
      throw new Error(error);
    }
  }
  return image;
};

export const imageToBase64URI = (image: string): string => `data:image/jpeg;base64, ${image}`;
