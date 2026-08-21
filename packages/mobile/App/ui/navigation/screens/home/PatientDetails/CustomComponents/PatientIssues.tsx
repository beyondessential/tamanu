import React, { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { RowView, StyledText } from '/styled/common';
import { Dot } from './Dot';
import { theme } from '/styled/theme';
import { PatientSection } from './PatientSection';
import usePatientIssuesQuery from '~/ui/hooks/queries/usePatientIssuesQuery';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { TranslatedText } from '/components/Translations/TranslatedText';

interface PatientIssuesProps {
  onEdit: () => void;
  patientId: string;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  content: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  issueRow: {
    marginTop: 20,
  },
});

export const PatientIssues = ({ onEdit, patientId }: PatientIssuesProps): ReactElement => {
  const { data: patientIssues, error, isPending } = usePatientIssuesQuery(patientId);

  let patientIssuesContent = null;
  if (error) {
    patientIssuesContent = <ErrorScreen error={error} />;
  } else if (isPending) {
    patientIssuesContent = <LoadingScreen />;
  } else if (patientIssues) {
    patientIssuesContent = patientIssues.map(({ id, note }) => (
      <RowView key={id} alignItems="center" style={styles.issueRow}>
        <Dot />
        <StyledText marginLeft={10} color={theme.colors.TEXT_MID}>
          {note}
        </StyledText>
      </RowView>
    ));
  }
  return (
    <View style={styles.container}>
      <PatientSection
        title={
          <TranslatedText
            stringId="patient.detailsSidebar.subheading.otherPatientIssues"
            fallback="Other patient issues"
          />
        }
        onEdit={onEdit}
      >
        <View style={styles.content}>{patientIssuesContent}</View>
      </PatientSection>
    </View>
  );
};
