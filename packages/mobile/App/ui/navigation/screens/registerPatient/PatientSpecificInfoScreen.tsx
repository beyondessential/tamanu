import React, { useCallback, ReactElement, useState } from 'react';
import { StatusBar } from 'react-native';
import { useFormikContext } from 'formik';
import { FullView } from '/styled/common';
import { PatientSpecificInfoForm } from '/components/Forms/NewPatientForm/PatientSpecificInfoForm';
import { Header } from './CommonComponents/Header';
import { getImageFromPhotoLibrary } from '/helpers/image';
import { PatientSpecificInfoScreenProps } from '/interfaces/screens/RegisterPatientStack/PatientSpecificInfoScreenProps';

const PatientSpecificInfoScreen = ({
  navigation,
}: PatientSpecificInfoScreenProps): ReactElement => {
  const onGoBack = useCallback(() => {
    navigation.goBack();
  }, []);

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

  const onSubmitForm = useCallback(() => {
    form.setSubmitting(true);
    setTimeout(() => {
      const values = form.values;
      // send request to create new patient
      // clear previous form data
      form.handleSubmit();
      form.resetForm();
    }, 2000);
  }, []);

  return (
    <FullView>
      <StatusBar barStyle="light-content" />
      <Header onGoBack={onGoBack} />
      <PatientSpecificInfoForm
        loadingProfileImage={loadingProfileImage}
        onLoadFingerPrint={onLoadFingerPrint}
        onLoadProfilePhoto={onLoadProfilePhoto}
        onSubmit={onSubmitForm}
      />
    </FullView>
  );
};

export default PatientSpecificInfoScreen;
