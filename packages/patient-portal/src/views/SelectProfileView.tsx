import React from 'react';
import { Navigate } from 'react-router';
import styled from 'styled-components';
import { ChevronRight } from 'lucide-react';
import { FormErrorMessage, TranslatedText } from '@tamanu/ui-components';
import { useSelectProfile } from '@api/mutations';
import { useProfilesQuery } from '@api/queries/useProfilesQuery';
import { Loading, PageColumn, Panel, rowLayout } from '@components/layout';
import { ProfileSummary } from '../features/profiles/ProfileSummary';

const Prompt = styled.p`
  margin: 4px 0 12px;
  color: var(--pf-text-secondary);
`;

const ProfileButton = styled.button.attrs({ type: 'button' })`
  ${rowLayout}
  width: 100%;
  border: none;
  background: none;
  color: inherit;
  text-align: start;
  cursor: pointer;

  &:active {
    background: var(--pf-option);
  }

  > svg:last-child {
    flex: none;
    width: 20px;
    height: 20px;
    color: var(--pf-text-tertiary);
  }
`;

export const SelectProfileView = () => {
  const { data: profiles, isPending } = useProfilesQuery();
  const {
    mutate: selectProfile,
    isPending: isSelecting,
    isError: hasSelectFailed,
  } = useSelectProfile();

  if (!isPending && !profiles?.data.length) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageColumn>
      <Prompt>
        <TranslatedText
          stringId="patientPortal.selectProfile.prompt"
          fallback="Select a profile to continue"
        />
      </Prompt>
      {hasSelectFailed && (
        <FormErrorMessage role="alert">
          <TranslatedText
            stringId="patientPortal.selectProfile.error"
            fallback="That profile couldn't be opened. Please try again."
          />
        </FormErrorMessage>
      )}
      {isPending ? (
        <Loading />
      ) : (
        profiles?.data.map(profile => (
          <Panel key={profile.portalUserId}>
            <ProfileButton
              disabled={isSelecting}
              onClick={() => selectProfile(profile.portalUserId)}
            >
              <ProfileSummary patient={profile} />
              <ChevronRight aria-hidden />
            </ProfileButton>
          </Panel>
        ))
      )}
    </PageColumn>
  );
};
