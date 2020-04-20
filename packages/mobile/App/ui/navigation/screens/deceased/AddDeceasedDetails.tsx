import React, { ReactElement, useMemo, useRef, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { scrollTo, calculateVerticalPositions } from '/helpers/screen';
import { BaseAppProps } from '../../../interfaces/BaseAppProps';
import { joinNames } from '/helpers/user';
import { compose } from 'redux';
import { withPatient } from '/containers/Patient';
import { DeceasedForm } from '/components/Forms/DeceasedForm';
import { StackHeader } from '/components/StackHeader';

const initialValues = {
  staffMember: '',
  deathCertificateNumber: '',
  date: null,
  time: null,
  causeOfDeath: '',
  placeOfDeath: '',
  additionalNotes: '',
};

type AddSickDetailScreenProps = {
  navigation: NavigationProp<any>;
} & BaseAppProps;

const Screen = ({
  navigation,
  selectedPatient,
}: AddSickDetailScreenProps): ReactElement => {
  const scrollViewRef = useRef<any>(null);
  const verticalPositions = useMemo(
    () => calculateVerticalPositions(Object.keys(initialValues)),
    [],
  );
  const scrollToField = useCallback(
    (fieldName: string) => (): void => {
      scrollTo(scrollViewRef, verticalPositions[fieldName]);
    },
    [scrollViewRef],
  );

  const navigateBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StackHeader
        onGoBack={navigateBack}
        subtitle={joinNames(selectedPatient)}
        title="Deceased"
      />
      <DeceasedForm
        scrollToField={scrollToField}
        initialValues={initialValues}
        scrollViewRef={scrollViewRef}
      />
    </FullView>
  );
};

export const AddDeceasedDetailsScreen = compose(withPatient)(Screen);
