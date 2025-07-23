import React from 'react';
import styled from 'styled-components';
import EditIcon from '@material-ui/icons/Edit';
import { Box, IconButton } from '@material-ui/core';
import { CHARTING_DATA_ELEMENT_IDS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InfoCard, InfoCardItem } from '../InfoCard';
import { TranslatedText } from '../Translation';
import { Colors } from '../../constants';
import { FormModal } from '../FormModal';
import { ChartForm } from '../../forms/ChartForm';

const StyledInfoCard = styled(InfoCard)`
  border-radius: 0;
  height: 40px;
  & div > span {
    font-size: 14px;
  }
`;

const ChartInstanceInfoLabel = styled(TranslatedText)`
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

export const ChartInstanceInfoSection = ({
  complexChartInstance = {},
  fieldVisibility,
  patient,
}) => {
  const {
    chartInstanceName,
    chartDate,
    chartType,
    chartSubtype,
    chartSurveyId,
  } = complexChartInstance;
  const isTypeVisible =
    fieldVisibility[CHARTING_DATA_ELEMENT_IDS.complexChartType] === VISIBILITY_STATUSES.CURRENT;
  const isSubtypeVisible =
    fieldVisibility[CHARTING_DATA_ELEMENT_IDS.complexChartSubtype] === VISIBILITY_STATUSES.CURRENT;
  return (
    <>
      <FormModal open={true} onClose={() => {console.log('close')}}>
        <ChartForm
          onClose={() => {console.log('close')}}
          onSubmit={() => {console.log('submit')}}
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
              onClick={() => {
                console.log('edit');
              }}
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
              stringId="complexChartInstance.location"
              fallback="Location:"
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
              stringId="complexChartInstance.date"
              fallback="Date & time of onset:"
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
                stringId="complexChartInstance.type"
                fallback="Type:"
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
                stringId="complexChartInstance.subtype"
                fallback="Sub type:"
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
