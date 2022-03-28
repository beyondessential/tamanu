import React, { ReactElement } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { RowView, StyledText, StyledView } from '/styled/common';
import { Dot } from './Dot';
import { theme } from '/styled/theme';
import { PatientSection } from './PatientSection';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';

interface PatientIssuesProps {
  onEdit: () => void;
  patientId: string;
}

export const PatientIssues = ({ onEdit, patientId }: PatientIssuesProps): ReactElement => {
  const isFocused = useIsFocused(); // reload data whenever the page is focused
  const [patientIssues, issuesError] = useBackendEffect(
    ({ models }) => {
      if (isFocused) {
        return models.PatientIssue.find({
          order: { recordedDate: 'ASC' },
          where: { patient: { id: patientId } },
        });
      }
    },
    [isFocused, patientId],
  );

  let patientIssuesContent = null;
  if (issuesError) {
    patientIssuesContent = <ErrorScreen error={issuesError} />;
  } else if (patientIssues) {
    patientIssuesContent = patientIssues.map(({ id, note }) => (
      <RowView key={id} alignItems="center" marginTop={10}>
        <Dot />
        <StyledText marginLeft={10} color={theme.colors.TEXT_MID}>
          {note}
        </StyledText>
      </RowView>
    ));
  } else {
    patientIssuesContent = <LoadingScreen />;
  }
  return (
    <StyledView marginBottom={40}>
      <PatientSection hasSeparator title="Other patient issues" onEdit={onEdit}>
        {patientIssuesContent}
      </PatientSection>
    </StyledView>
  );
};
