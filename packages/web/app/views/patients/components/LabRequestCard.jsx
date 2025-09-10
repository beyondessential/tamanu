import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { TAMANU_COLORS, TranslatedText, TranslatedReferenceData } from '@tamanu/ui-components';
import { labsIcon } from '../../../constants/images';
import { DateDisplay } from '../../../components';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 5px;
  padding: 18px;
  margin-bottom: 15px;
`;

const LabIcon = styled.img`
  width: 24px;
  height: 24px;
  border: none;
  margin-right: 14px;
`;

const CardItem = styled.div`
  display: grid;
  grid-template-columns: max-content max-content;
  grid-column-gap: 2px;
  grid-row-gap: 2px;
  font-size: 14px;
  line-height: 18px;
  color: ${(props) => props.theme.palette.text.tertiary};
`;

const BorderSection = styled(CardItem)`
  margin-left: 45px;
  padding: 0 10px;
  border-left: 1px solid ${TAMANU_COLORS.outline};
`;

const CardLabel = styled.span`
  margin-right: 5px;
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${(props) => props.theme.palette.text.secondary};
`;

export const LabRequestCard = ({ labRequest, actions }) => {
  return (
    <Container data-testid="container-7pq6">
      <Box display="flex" alignItems="center" data-testid="box-evl7">
        <LabIcon src={labsIcon} data-testid="labicon-e74e" />
        <CardItem data-testid="carditem-urbq">
          <CardLabel data-testid="cardlabel-9yw2">
            <TranslatedText
              stringId="lab.details.card.item.labTestId.label"
              fallback="Lab test ID"
              data-testid="translatedtext-scz2"
            />
            :
          </CardLabel>
          <CardValue data-testid="cardvalue-wpiy">{labRequest.displayId}</CardValue>
          <CardLabel data-testid="cardlabel-hqix">
            <TranslatedText
              stringId="general.requestDate.label"
              fallback="Request date"
              data-testid="translatedtext-mu6g"
            />
            :
          </CardLabel>
          <CardValue data-testid="cardvalue-bag0">
            <DateDisplay date={labRequest.requestedDate} data-testid="datedisplay-wngn" />
          </CardValue>
        </CardItem>
        <BorderSection data-testid="bordersection-pgdb">
          <CardLabel data-testid="cardlabel-hifd">
            <TranslatedText
              stringId="general.requestingClinician.label"
              fallback="Requesting :clinician"
              replacements={{
                clinician: (
                  <TranslatedText
                    stringId="general.localisedField.clinician.label.short"
                    fallback="Clinician"
                    casing="lower"
                    data-testid="translatedtext-hppd"
                  />
                ),
              }}
              data-testid="translatedtext-2j11"
            />
            :
          </CardLabel>
          <CardValue data-testid="cardvalue-tin5">{labRequest.requestedBy?.displayName}</CardValue>
          <CardLabel data-testid="cardlabel-cuwo">
            <TranslatedText
              stringId="general.department.label"
              fallback="Department"
              data-testid="translatedtext-b1o5"
            />
            :
          </CardLabel>
          <CardValue data-testid="cardvalue-l8vk">
            {labRequest.department?.name && (
              <TranslatedReferenceData
                fallback={labRequest.department.name}
                value={labRequest.department.id}
                category="department"
                data-testid="translatedreferencedata-wp5x"
              />
            )}
          </CardValue>
        </BorderSection>
      </Box>
      {actions || null}
    </Container>
  );
};
