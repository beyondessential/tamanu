import React, { ReactElement } from 'react';
import { NavigationProp } from '@react-navigation/native';

import { StackHeader } from '~/ui/components/StackHeader'
import { FullView } from '~/ui/styled/common';

type AddPatientIssueScreenProps = {
  navigation: NavigationProp<any>;
  // selectedPatient: IPatient;
};

export const AddPatientIssueScreen = ({
  navigation,
}: AddPatientIssueScreenProps): ReactElement<AddPatientIssueScreenProps> => {
  return (
    <FullView>
      <StackHeader
        title="Add patient issue"
        subtitle={'TODO'/*joinNames(selectedPatient)*/}
        onGoBack={navigation.goBack}
      />
    </FullView>
  );
};
