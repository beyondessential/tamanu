import React, { useCallback, useRef, ReactElement, useMemo } from 'react';
import { calculateVerticalPositions, scrollTo } from '/helpers/screen';
import { FullView } from '/root/App/styled/common';
import { NameSection } from './NameSection';
import { ContactDetailsSection } from './ContactDetailsSection';
import { LocationDetailsSection } from './LocationDetailsSection';
import { SubmitSection } from './SubmitSection';
import { newPatientFormValues } from '/root/App/helpers/form';
import { FormScreenView } from '../../FormScreenView';

export type FormSection = {
  scrollToField: (fieldName: string) => () => void;
};

type PatientPersonalInfoFormProps = {
  onPressNext: () => void;
};

export const PatientPersonalInfoForm = ({
  onPressNext,
}: PatientPersonalInfoFormProps): ReactElement => {
  const scrollViewRef = useRef<any>(null);
  const verticalPositions = useMemo(
    () => calculateVerticalPositions(Object.keys(newPatientFormValues)),
    [],
  );
  const scrollToComponent = useCallback(
    (fieldName: string) => (): void => {
      scrollTo(scrollViewRef, verticalPositions[fieldName]);
    },
    [scrollViewRef],
  );
  return (
    <FullView>
      <FormScreenView scrollViewRef={scrollViewRef}>
        <NameSection scrollToField={scrollToComponent} />
        <ContactDetailsSection scrollToField={scrollToComponent} />
        <LocationDetailsSection scrollToField={scrollToComponent} />
      </FormScreenView>
      <SubmitSection onPress={onPressNext} />
    </FullView>
  );
};
