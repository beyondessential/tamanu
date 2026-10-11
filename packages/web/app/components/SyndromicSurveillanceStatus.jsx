import React, { useState } from 'react';
import styled from 'styled-components';
import { subject } from '@casl/ability';

import { SYNDROMIC_SURVEILLANCE_SURVEY_ID } from '@tamanu/constants';
import { useEncounterSyndromicSurveillanceQuery } from '../api/queries/useEncounterSyndromicSurveillanceQuery';
import { Colors } from '../constants/styles';
import { useAuth } from '../contexts/Auth';
import { TextButton } from './Button';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { SyndromicSurveillanceComplete } from './SyndromicSurveillanceComplete';
import { SyndromicSurveillanceModal } from './SyndromicSurveillanceModal';
import { TranslatedText } from './Translation/TranslatedText';

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
  font-size: 14px;
`;

const StatusText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const SyndromicSurveillanceTextButton = styled(TextButton)`
  font-size: 14px;

  &,
  :hover {
    color: ${props => (props.$isPrimary ? Colors.primary : Colors.darkestText)};
    font-weight: ${props => (props.$isPrimary ? 500 : 400)};
    text-decoration: ${props => (props.$isPrimary ? 'none' : 'underline')};
  }
`;

const SyndromicSurveillanceLabel = () => (
  <TranslatedText
    stringId="encounter.syndromicSurveillance.label"
    fallback="Syndromic surveillance"
    data-testid="translatedtext-syndromic-surveillance"
  />
);

/**
 * The encounter's syndromic surveillance, for the diagnosis pane: an action to complete the form
 * until it has a response, then that it is complete with an action to view or edit the response.
 *
 * spec: SYND#diagnosis-pane
 * spec: SYND#permissions
 */
export const SyndromicSurveillanceStatus = ({ encounterId, patient }) => {
  const { ability } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResponseDetailsOpen, setIsResponseDetailsOpen] = useState(false);

  const syndromicSurveillanceSurvey = subject('Survey', { id: SYNDROMIC_SURVEILLANCE_SURVEY_ID });
  const canRead = ability.can('read', syndromicSurveillanceSurvey);
  const canSubmit = ability.can('submit', syndromicSurveillanceSurvey);
  const canWrite = ability.can('write', syndromicSurveillanceSurvey);

  const { data: syndromicSurveillance } = useEncounterSyndromicSurveillanceQuery(encounterId, {
    enabled: canRead,
  });

  if (!canRead || !syndromicSurveillance?.isAvailable) {
    return null;
  }

  const { surveyResponseId } = syndromicSurveillance;

  if (!surveyResponseId) {
    return (
      <>
        <StatusRow data-testid="statusrow-syndromic-surveillance">
          <SyndromicSurveillanceTextButton
            $isPrimary
            onClick={() => setIsFormOpen(true)}
            disabled={!canSubmit}
            data-testid="textbutton-syndromic-surveillance"
          >
            <SyndromicSurveillanceLabel />
          </SyndromicSurveillanceTextButton>
        </StatusRow>
        <SyndromicSurveillanceModal
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          encounterId={encounterId}
          patient={patient}
        />
      </>
    );
  }

  return (
    <>
      <StatusRow data-testid="statusrow-syndromic-surveillance">
        <StatusText>
          <span>
            <SyndromicSurveillanceLabel />:
          </span>
          <SyndromicSurveillanceComplete data-testid="syndromicsurveillancecomplete-diagnosis" />
        </StatusText>
        <SyndromicSurveillanceTextButton
          onClick={() => (canWrite ? setIsFormOpen(true) : setIsResponseDetailsOpen(true))}
          data-testid="textbutton-syndromic-surveillance-viewedit"
        >
          <TranslatedText
            stringId={canWrite ? 'general.action.viewEdit' : 'general.action.view'}
            fallback={canWrite ? 'View/Edit' : 'View'}
            data-testid="translatedtext-view-edit"
          />
        </SyndromicSurveillanceTextButton>
      </StatusRow>
      {canWrite ? (
        <SyndromicSurveillanceModal
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          encounterId={encounterId}
          patient={patient}
          surveyResponseId={surveyResponseId}
        />
      ) : (
        <SurveyResponseDetailsModal
          surveyResponseId={isResponseDetailsOpen ? surveyResponseId : null}
          onClose={() => setIsResponseDetailsOpen(false)}
        />
      )}
    </>
  );
};
