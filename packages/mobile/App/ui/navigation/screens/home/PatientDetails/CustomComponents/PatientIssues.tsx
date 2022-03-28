import React, { ReactElement, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { RowView, StyledText, StyledView } from '/styled/common';
import { Dot } from './Dot';
import { theme } from '/styled/theme';
import { PatientSection } from './PatientSection';
import { useEffectWithBackend } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';

interface PatientIssuesProps {
  onEdit: () => void;
  patientId: string;
}

export const PatientIssues = ({ onEdit, patientId }: PatientIssuesProps): ReactElement => {
  const isFocused = useIsFocused(); // reload data whenever the page is focused
  const [patientIssues, issuesError, issuesLoading] = useEffectWithBackend(
    useCallback(
      ({ models }) => models.PatientIssue.find({
        order: { recordedDate: 'ASC' },
        where: { patient: { id: patientId } },
      }),
      [patientId],
    ),
    { shouldExecute: isFocused },
  );

  let patientIssuesContent = null;
  if (issuesError) {
    patientIssuesContent = <ErrorScreen error={issuesError} />;
  } else if (issuesLoading) {
    patientIssuesContent = <LoadingScreen />;
  } else if (patientIssues) {
    patientIssuesContent = patientIssues.map(({ id, note }) => (
      <RowView key={id} alignItems="center" marginTop={10}>
        <Dot />
        <StyledText marginLeft={10} color={theme.colors.TEXT_MID}>
          {note}
        </StyledText>
      </RowView>
    ));
  }
  return (
    <StyledView marginBottom={40}>
      <PatientSection hasSeparator title="Other patient issues" onEdit={onEdit}>
        {patientIssuesContent}
      </PatientSection>
    </StyledView>
  );
};
