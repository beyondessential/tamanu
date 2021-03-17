import React, { ReactElement } from 'react';
import { KeyInformationSection } from './KeyInformationSection';
import { IdentificationSection } from './IdentificationSection';
import { FullView } from '/styled/common';
import { SubmitSection } from './SubmitSection';

type PatientSpecificInfoFormProps = {
  loadingProfileImage: boolean;
  onSubmit: () => void;
  onLoadProfilePhoto: () => void;
  onLoadFingerPrint: () => void;
};

export const PatientSpecificInfoForm = ({
  loadingProfileImage,
  onSubmit,
  onLoadProfilePhoto,
  onLoadFingerPrint,
}: PatientSpecificInfoFormProps): ReactElement => (
  <FullView>
    <FullView padding={20}>
      <KeyInformationSection />
      <IdentificationSection
        loadingProfileImage={loadingProfileImage}
        loadFingerPrint={onLoadFingerPrint}
        loadPhoto={onLoadProfilePhoto}
      />
    </FullView>
    <SubmitSection onPress={onSubmit} />
  </FullView>
);
