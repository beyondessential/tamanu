import React, { ReactElement, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { RowView, StyledText, StyledView } from '/styled/common';
import { Dot } from './Dot';
import { theme } from '/styled/theme';
import { PatientSection } from './PatientSection';
import { useBackend } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { TranslatedText } from '/components/Translations/TranslatedText';

interface PatientIssuesProps {
  onEdit: () => void;
  patientId: string;
}

export const PatientIssues = ({ onEdit, patientId }: PatientIssuesProps): ReactElement => {
  const backend = useBackend();
  const [patientIssues, setPatientIssues] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async (): Promise<void> => {
        try {
          const { models } = backend;
          const result = await models.PatientIssue.find({
            order: { recordedDate: 'ASC' },
            where: { patient: { id: patientId } },
          });
          if (!mounted) {
            return;
          }
          setPatientIssues(result);
          setLoading(false);
        } catch (err) {
          if (!mounted) {
            return;
          }
          setError(err);
          setLoading(false);
        }
      })();
      return (): void => {
        mounted = false;
      };
    }, [backend, patientId]),
  );

  let patientIssuesContent = null;
  if (error) {
    patientIssuesContent = <ErrorScreen error={error} />;
  } else if (loading) {
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
      <PatientSection
        title={
          <TranslatedText
            stringId="subheading.otherPatientIssues"
            fallback="Other patient issues"
          />
        }
        onEdit={onEdit}
      >
        {patientIssuesContent}
      </PatientSection>
    </StyledView>
  );
};
