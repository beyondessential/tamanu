import React, { useState } from 'react';
import styled from 'styled-components';
import EditIcon from '@material-ui/icons/Edit';
import { Box, IconButton } from '@material-ui/core';
import { CHARTING_DATA_ELEMENT_IDS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InfoCard, InfoCardItem } from '../InfoCard';
import { TranslatedReferenceData } from '../Translation';
import { Colors } from '../../constants';
import { FormModal } from '../FormModal';
import { ChartForm } from '../../forms/ChartForm';
import { useEncounter } from '../../contexts/Encounter';
import { getAnswersFromData } from '../../utils';
import { useApi } from '../../api';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../contexts/Translation';

const StyledInfoCard = styled(InfoCard)`
  border-radius: 0;
  height: 40px;
  & div > span {
    font-size: 14px;
  }
`;

const ChartInstanceInfoLabel = styled(TranslatedReferenceData)`
  font-weight: 500;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0;
`;

const StyledEditIcon = styled(EditIcon)`
  float: right;
  width: 1rem;
  height: 1rem;
  color: ${Colors.primary};
`;

const isVisible = (fieldVisibility, fieldValue, isType) => {
  const fieldId = isType
    ? CHARTING_DATA_ELEMENT_IDS.complexChartType
    : CHARTING_DATA_ELEMENT_IDS.complexChartSubtype;
  return !!fieldValue || fieldVisibility[fieldId] === VISIBILITY_STATUSES.CURRENT;
};

export const ChartInstanceInfoSection = ({
  complexChartInstance = {},
  fieldVisibility,
  patient,
  selectedChartSurveyName,
  coreComplexChartSurvey,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { encounter } = useEncounter();
  const api = useApi();
  const queryClient = useQueryClient();
  const { getTranslation } = useTranslation();
  const {
    chartInstanceId,
    chartInstanceName,
    chartDate,
    chartType,
    chartSubtype,
    chartSurveyId,
  } = complexChartInstance;
  const isTypeVisible = isVisible(fieldVisibility, chartType, true);
  const isSubtypeVisible = isVisible(fieldVisibility, chartSubtype, false);
  const actionText = getTranslation('general.action.edit', 'Edit');
  const title = `${selectedChartSurveyName} | ${actionText}`;
  const handleEdit = async ({ survey, ...data }) => {
    const responseData = {
      answers: await getAnswersFromData(data, survey),
    };

    await api.put(`surveyResponse/complexChartInstance/${chartInstanceId}`, responseData);
    queryClient.invalidateQueries(['encounterComplexChartInstances', encounter.id, chartSurveyId]);
    setIsEditModalOpen(false);
  };

  const instanceNameDataElement = coreComplexChartSurvey?.components?.find(
    c => c.dataElementId === CHARTING_DATA_ELEMENT_IDS.complexChartInstanceName,
  )?.dataElement;
  const dateDataElement = coreComplexChartSurvey?.components?.find(
    c => c.dataElementId === CHARTING_DATA_ELEMENT_IDS.complexChartDate,
  )?.dataElement;
  const typeDataElement = coreComplexChartSurvey?.components?.find(
    c => c.dataElementId === CHARTING_DATA_ELEMENT_IDS.complexChartType,
  )?.dataElement;
  const subtypeDataElement = coreComplexChartSurvey?.components?.find(
    c => c.dataElementId === CHARTING_DATA_ELEMENT_IDS.complexChartSubtype,
  )?.dataElement;

  return (
    <>
      <FormModal title={title} open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <ChartForm
          onClose={() => {setIsEditModalOpen(false)}}
          onSubmit={handleEdit}
          patient={patient}
          chartSurveyId={chartSurveyId}
        />
      </FormModal>
      <StyledInfoCard
        gridRowGap={10}
        elevated={false}
        contentMarginBottom={20}
        headerContent={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            marginTop="-1rem"
            marginRight="-1rem"
          >
            <StyledIconButton
              onClick={() => setIsEditModalOpen(true)}
              data-testid="stylediconbutton-edit-fkzu"
            >
              <StyledEditIcon />
            </StyledIconButton>
          </Box>
        }
        data-testid="styledinfocard-vd5f"
      >
        <InfoCardItem
          fontSize={14}
          label={
            <ChartInstanceInfoLabel
              category="programDataElement"
              value={instanceNameDataElement?.id}
              fallback={instanceNameDataElement?.name}
              data-testid="chartinstanceinfolabel-2vmu"
            />
          }
          value={chartInstanceName}
          data-testid="infocarditem-1nxo"
        />
        <InfoCardItem
          fontSize={14}
          label={
            <ChartInstanceInfoLabel
              category="programDataElement"
              value={dateDataElement?.id}
              fallback={dateDataElement?.name}
              data-testid="chartinstanceinfolabel-xn1c"
            />
          }
          value={chartDate || '-'}
          data-testid="infocarditem-czi0"
        />

        {isTypeVisible ? (
          <InfoCardItem
            fontSize={14}
            label={
              <ChartInstanceInfoLabel
                category="programDataElement"
                value={typeDataElement?.id}
                fallback={typeDataElement?.name}
                data-testid="chartinstanceinfolabel-m3or"
              />
            }
            value={chartType || '-'}
            data-testid="infocarditem-ql06"
          />
        ) : null}

        {isSubtypeVisible ? (
          <InfoCardItem
            fontSize={14}
            label={
              <ChartInstanceInfoLabel
                category="programDataElement"
                value={subtypeDataElement?.id}
                fallback={subtypeDataElement?.name}
                data-testid="chartinstanceinfolabel-p5wn"
              />
            }
            value={chartSubtype || '-'}
            data-testid="infocarditem-8nk8"
          />
        ) : null}
      </StyledInfoCard>
    </>
  );
};
