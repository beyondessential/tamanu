import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { CircleCheck, FileText } from 'lucide-react';
import { TranslatedReferenceData, TranslatedText } from '@tamanu/ui-components';

import { useOutstandingSurveysQuery } from '@api/queries/useOutstandingSurveysQuery';
import { surveyQueryOptions } from '@api/queries/useSurveyQuery';
import { timeZoneQueryOptions } from '@api/queries/useTimeZoneQuery';
import { useApi } from '@api/useApi';
import {
  Loading,
  Panel,
  Row,
  RowDetail,
  RowIcon,
  RowLink,
  RowText,
  RowTitle,
  Section,
  SectionTitle,
} from '@components/layout';
import { settingsQueryOptions } from '../../contexts/SettingsContext';

/** Forms the patient has been asked to fill in, first on the dashboard as they need doing. */
export const ToDoSection = () => {
  const api = useApi();
  const { data: forms, isLoading } = useOutstandingSurveysQuery();

  // Everything a form needs is loaded with the list, so tapping one opens it straight away
  const facilityIds = [...new Set(forms?.map(form => form.facilityId) ?? [])];
  useQueries({
    queries: forms?.length
      ? [
          ...forms.map(form => surveyQueryOptions(api, form.survey.id)),
          ...facilityIds.map(facilityId => settingsQueryOptions(api, facilityId)),
          timeZoneQueryOptions(api),
        ]
      : [],
  });

  const renderForms = () => {
    if (isLoading) return <Loading />;
    if (!forms?.length) {
      return (
        <Row>
          <RowIcon $tone="success">
            <CircleCheck aria-hidden />
          </RowIcon>
          <RowText>
            <RowTitle>
              <TranslatedText stringId="patientPortal.toDo.none" fallback="You're all up to date" />
            </RowTitle>
          </RowText>
        </Row>
      );
    }
    return forms.map(form => (
      <RowLink key={form.id} to={`/survey/${form.survey.id}`}>
        <RowIcon $tone="alert">
          <FileText aria-hidden />
        </RowIcon>
        <RowText>
          <RowTitle>
            <TranslatedReferenceData
              category="survey"
              value={form.survey.id}
              fallback={form.survey.name}
            />
          </RowTitle>
          <RowDetail>
            <TranslatedText
              stringId="patientPortal.toDo.form"
              fallback="Form to fill in, from :clinician"
              replacements={{ clinician: form.assignedBy.displayName }}
            />
          </RowDetail>
        </RowText>
      </RowLink>
    ));
  };

  return (
    <Section aria-labelledby="to-do-title">
      <SectionTitle id="to-do-title">
        <TranslatedText stringId="patientPortal.toDo.title" fallback="To do" />
      </SectionTitle>
      <Panel>{renderForms()}</Panel>
    </Section>
  );
};
