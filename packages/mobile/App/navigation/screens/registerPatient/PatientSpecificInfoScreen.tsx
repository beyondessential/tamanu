import React, { useCallback, ReactElement, useState } from 'react';
import { StatusBar } from 'react-native';
import { useFormikContext } from 'formik';
import { FullView } from '/styled/common';
import { PatientSpecificInfoForm } from '/components/Forms/NewPatientForm/PatientSpecificInfoForm';
import { Header } from './CommonComponents/Header';
import { getImageFromPhotoLibrary } from '/helpers/image';

const PatientSpecificInfoScreen = (): ReactElement => {
  const form = useFormikContext();
  const [loadingProfileImage, setLoadingProfileImage] = useState(false);
  const onLoadFingerPrint = useCallback(async () => {
    try {
      const image = await getImageFromPhotoLibrary();
      if (image) {
        form.setFieldValue('fingerPrint', image.data);
      }
    } catch (error) {
      console.log('Error loading Finger print');
    }
  }, []);
  const onLoadProfilePhoto = useCallback(async () => {
    try {
      setLoadingProfileImage(true);
      const image = await getImageFromPhotoLibrary();
      if (image) {
        form.setFieldValue('profilePhoto', image.data);
      }
      setLoadingProfileImage(false);
    } catch (error) {
      setLoadingProfileImage(false);
      form.setFieldError(
        'profilePhoto',
        'Error Loading image, try again later.',
      );
      form.setFieldTouched('profilePhoto', true, false);
      setTimeout(() => {
        form.setFieldError('profilePhoto', '');
      }, 3000);
    }
  }, []);

  return (
    <FullView>
      <StatusBar barStyle="light-content" />
      <Header />
      <PatientSpecificInfoForm
        loadingProfileImage={loadingProfileImage}
        onLoadFingerPrint={onLoadFingerPrint}
        onLoadProfilePhoto={onLoadProfilePhoto}
        onSubmit={form.handleSubmit}
      />
    </FullView>
  );
};

export default PatientSpecificInfoScreen;
