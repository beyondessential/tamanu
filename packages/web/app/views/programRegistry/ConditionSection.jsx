import React, { useState } from 'react';
import styled from 'styled-components';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton } from '@material-ui/core';
import { sortBy } from 'lodash';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { Colors } from '../../constants';
import { Heading5, getReferenceDataStringId, TranslatedText } from '../../components';
import { usePatientProgramRegistryConditionsQuery } from '../../api/queries/usePatientProgramRegistryConditionsQuery';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { RemoveConditionFormModal } from './RemoveConditionFormModal';
import { AddConditionFormModal } from './AddConditionFormModal';
import { ConditionalTooltip } from '../../components/Tooltip';
import { useTranslation } from '../../contexts/Translation';

const Container = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  width: 28%;
  background-color: ${Colors.white};
  padding-top: 13px;
  padding-left: 20px;
  padding-right: 20px;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: flex-start;
  border: 1px solid ${Colors.softOutline};
  border-radius: 5px;
`;

const HeadingContainer = styled.div`
  border-bottom: 1px solid ${Colors.softOutline};
  padding-bottom: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  width: 100%;
`;

const ConditionContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  width: 100%;
  margin-top: 5px;
`;

const ClippedConditionName = styled.span`
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
  width: 95%;
`;

const AddConditionButton = styled.button`
  display: inline-block;
  padding: 10px 20px;
  color: ${Colors.darkestText};
  text-decoration: underline;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  padding: 0px;
  background-color: transparent;

  :hover {
    color: ${Colors.blue};
  }
  :disabled {
    color: ${Colors.darkText};
  }
`;

export const ConditionSection = ({ patientProgramRegistration, programRegistryConditions }) => {
  const { data: conditions, isLoading } = usePatientProgramRegistryConditionsQuery(
    patientProgramRegistration.patientId,
    patientProgramRegistration.programRegistryId,
  );
  const { getTranslation } = useTranslation();
  const [conditionToRemove, setConditionToRemove] = useState();
  const [openAddCondition, setOpenAddCondition] = useState(false);

  if (isLoading) return <LoadingIndicator data-testid='loadingindicator-fndp' />;

  const isRemoved =
    patientProgramRegistration.registrationStatus === REGISTRATION_STATUSES.INACTIVE;

  if (!programRegistryConditions || !programRegistryConditions.length) return <></>;

  const translatedData = conditions?.data?.map(condition => {
    const { programRegistryCondition = {} } = condition;
    const { id, name } = programRegistryCondition;
    const translatedName = getTranslation(
      getReferenceDataStringId(id, 'programRegistryCondition'),
      name,
    );

    return { ...condition, translatedName };
  });

  const sortedData = sortBy(translatedData, c => c.translatedName);

  return (
    <Container data-testid='container-e9ot'>
      <HeadingContainer data-testid='headingcontainer-63dn'>
        <Heading5 data-testid='heading5-qhuo'>
          <TranslatedText
            stringId="programRegistry.relatedConditions.label"
            fallback="Related conditions"
            data-testid='translatedtext-tezx' />
        </Heading5>
        <ConditionalTooltip
          title={
            <TranslatedText
              stringId="programRegistry.conditions.patientInactive.tooltip"
              fallback="Patient must be active"
              data-testid='translatedtext-vqzq' />
          }
          visible={isRemoved}
          data-testid='conditionaltooltip-a43q'>
          <AddConditionButton
            onClick={() => setOpenAddCondition(true)}
            disabled={isRemoved}
            data-testid='addconditionbutton-dpis'>
            <TranslatedText
              stringId="programRegistry.conditions.addCondition.button"
              fallback="+ Add condition"
              data-testid='translatedtext-79jd' />
          </AddConditionButton>
        </ConditionalTooltip>
      </HeadingContainer>
      {sortedData.map((condition, index) => (
        <ConditionContainer key={condition.id} data-testid={`conditioncontainer-ka0k-${index}`}>
          <ConditionalTooltip
            title={condition.translatedName}
            visible={condition.translatedName?.length > 30}
            data-testid={`conditionaltooltip-9k0h-${index}`}>
            <ClippedConditionName data-testid={`clippedconditionname-z0wi-${index}`}>{condition.translatedName}</ClippedConditionName>
          </ConditionalTooltip>
          <ConditionalTooltip
            title="Patient must be active"
            visible={isRemoved}
            data-testid={`conditionaltooltip-lakj-${index}`}>
            <IconButton
              style={{ padding: 0 }}
              onClick={() => setConditionToRemove(condition)}
              disabled={isRemoved}
              data-testid={`iconbutton-ft2o-${index}`}>
              <CloseIcon style={{ fontSize: '14px' }} data-testid={`closeicon-qm8f-${index}`} />
            </IconButton>
          </ConditionalTooltip>
        </ConditionContainer>
      ))}
      {openAddCondition && (
        <AddConditionFormModal
          onClose={() => setOpenAddCondition(false)}
          patientProgramRegistration={patientProgramRegistration}
          patientProgramRegistrationConditions={conditions?.data?.map(x => ({
            value: x.programRegistryConditionId,
          }))}
          programRegistryConditions={programRegistryConditions}
          open
          data-testid='addconditionformmodal-wa4w' />
      )}
      {conditionToRemove && (
        <RemoveConditionFormModal
          patientProgramRegistration={patientProgramRegistration}
          conditionToRemove={conditionToRemove}
          onSubmit={() => setConditionToRemove(undefined)}
          onCancel={() => setConditionToRemove(undefined)}
          open
          data-testid='removeconditionformmodal-g7vx' />
      )}
    </Container>
  );
};
