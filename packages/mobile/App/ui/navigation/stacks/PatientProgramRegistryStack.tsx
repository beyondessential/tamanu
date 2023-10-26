import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { compose } from 'redux';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { withPatient } from '~/ui/containers/Patient';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { FullView } from '~/ui/styled/common';

interface PatientProgramRegistryProps extends BaseAppProps {
  navigation: NavigationProp<any>;
}
const PatientProgramRegistry = ({ navigation, selectedPatient }: PatientProgramRegistryProps) => {
  return (
    <ErrorBoundary>
      <FullView>
        <EmptyStackHeader title="Program registry" onGoBack={() => navigation.goBack()} />
      </FullView>
      {/* <Text>PatientProgramRegistryStack</Text>; */}
    </ErrorBoundary>
  );
};

export const PatientProgramRegistryStack = compose(withPatient)(PatientProgramRegistry);
