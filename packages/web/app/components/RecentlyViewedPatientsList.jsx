import { Collapse } from '@material-ui/core';
import NavigateBefore from '@mui/icons-material/NavigateBefore';
import NavigateNext from '@mui/icons-material/NavigateNext';
import IconButton from '@mui/material/IconButton';
import Typography, { typographyClasses } from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown as ExpandMore } from 'lucide-react';
import React, { useCallback, useId, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled, { css } from 'styled-components';

import {
  DateDisplay,
  TAMANU_COLORS,
  ThemedTooltip,
  TranslatedSex,
  TranslatedText,
  useApi,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { reloadPatient } from '../store/patient';
import { usePatientNavigation } from '../utils/usePatientNavigation';

const colorFromEncounterType = /** @type {const} */ ({
  admission: TAMANU_COLORS.green,
  clinic: '#E9AC50',
  imaging: '#E9AC50',
  triage: TAMANU_COLORS.orange,
  observation: TAMANU_COLORS.orange,
  emergency: TAMANU_COLORS.orange,
  default: TAMANU_COLORS.blue,
});

function getPatientStatusColor({ $encounterType, $isPatientDeceased }) {
  if ($isPatientDeceased) {
    return TAMANU_COLORS.midText;
  }

  return colorFromEncounterType[$encounterType || 'default'] || colorFromEncounterType.default;
}

const SectionLabel = styled.h2`
  color: ${props => props.theme.palette.text.primary};
  font-size: inherit;
  font-weight: 500;
  letter-spacing: 0;
  margin-block: 0;
  text-decoration: none;
  text-transform: none;
`;

const CardListContainer = styled.div`
  align-items: center;
  border-radius: ${p => p.theme.shape.borderRadius}px;
  display: flex;
  flex-direction: row;
  ${p =>
    p.$isDashboard &&
    css`
      background-color: ${p => p.theme.palette.background.paper};
      border: 1px solid ${p => p.theme.palette.divider};
      padding-block: 10px;
    `}
`;

const UnorderedList = styled.ul.attrs({ role: 'list' })`
  display: grid;
  font-size: 14px;
  gap: 10px;
  grid-template-columns: repeat(${p => p.$columnCount}, 1fr);
  inline-size: 100%;
`;

const ListItem = styled.li`
  background-color: ${p => p.theme.palette.background.paper};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: 5px;
  padding-bottom: 15px;
  padding: 10px;
  &:hover {
    background-color: ${p => p.theme.palette.action.hover};
  }
  ${p =>
    p.$isDashboard &&
    css`
      border: 1px solid ${p => p.theme.palette.divider};
    `}
`;

const CardComponentContent = styled.div`
  min-width: 0;
`;

const CardTitle = styled(Typography)`
  &.${typographyClasses.root} {
    color: ${getPatientStatusColor};
    font-size: inherit;
    font-weight: bold;
    line-height: inherit;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const CardText = styled(Typography)`
  &.${typographyClasses.root} {
    font: inherit;
  }
`;

const PatientStatusIndicator = styled.div`
  background-color: ${getPatientStatusColor};
  block-size: 3lh;
  border-radius: calc(1px * infinity);
  inline-size: 4px;
`;

const ContainerTitle = styled.div`
  align-items: center;
  border-block-end: 1px solid transparent;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  margin-inline: 30px;
  padding-block: 1em;
  &:not([aria-expanded='true']) {
    border-color: ${p => p.theme.palette.divider};
  }
`;

const DisclosureIcon = styled(ExpandMore)`
  transition: ${p => p.theme.transitions.create(['rotate'])};
  [aria-expanded='true'] & {
    rotate: x 0.5turn;
  }
`;

const RightArrowButton = styled(IconButton)`
  padding: 2px;
`;

const LeftArrowButton = styled(IconButton)`
  padding: 2px;
`;

const MarginDiv = styled.div`
  width: 30px;
`;

const SectionTitle = styled.h2`
  align-self: flex-start;
  font-size: 16px;
  font-weight: 500;
  margin-block: 0;
  margin-inline-start: 20px;
`;

const PATIENTS_PER_PAGE = 6;

const Card = ({ patient, handleClick, isDashboard, index }) => {
  const isPatientDeceased = Boolean(patient.dateOfDeath);

  return (
    <ListItem
      onClick={() => handleClick(patient.id)}
      $isDashboard={isDashboard}
      data-testid={`cardcomponent-j39j-${index}`}
    >
      <PatientStatusIndicator
        $encounterType={patient.encounter_type}
        $isPatientDeceased={isPatientDeceased}
        data-testid={`patientstatusindicator-a5ir-${index}`}
      >
        <VisuallyHidden>{patient.encounter_type}</VisuallyHidden>
      </PatientStatusIndicator>
      <CardComponentContent data-testid={`cardcomponentcontent-${index}`}>
        <ThemedTooltip
          title={`${patient.firstName || ''} ${patient.lastName || ''}`}
          data-testid="themedtooltip-i98w"
        >
          <CardTitle
            $encounterType={patient.encounter_type}
            $isPatientDeceased={isPatientDeceased}
            data-testid={`cardtitle-qqhk-${index}`}
          >
            {patient.firstName} {patient.lastName}
          </CardTitle>
        </ThemedTooltip>
        <CardText data-testid={`cardtext-iro1-${index}`}>{patient.displayId}</CardText>
        <CardText data-testid={`capitalizedcardtext-zu58-${index}`}>
          <TranslatedSex sex={patient.sex} casing="capitalize" />
        </CardText>
        <CardText data-testid={`cardtext-i2bu-${index}`}>
          <TranslatedText stringId="general.dateOfBirth.label.short" fallback="DOB" />:{' '}
          <DateDisplay
            date={patient.dateOfBirth}
            format="shortest"
            data-testid={`datedisplay-tw5s-${index}`}
          />
        </CardText>
      </CardComponentContent>
    </ListItem>
  );
};

export const RecentlyViewedPatientsList = ({
  encounterType,
  isDashboard = false,
  patientPerPage = PATIENTS_PER_PAGE,
  ...props
}) => {
  const { navigateToPatient } = usePatientNavigation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const collapseId = useId();

  const dispatch = useDispatch();
  const api = useApi();

  const { data: { data: recentlyViewedPatients = [] } = {} } = useQuery(
    ['recentlyViewedPatients', encounterType],
    () => api.get('user/recently-viewed-patients', { encounterType }),
  );

  const pageCount = Math.ceil(recentlyViewedPatients?.length / patientPerPage);
  const changePage = delta => setPageIndex(Math.max(0, Math.min(pageCount - 1, pageIndex + delta)));

  const cardOnClick = useCallback(
    async patientId => {
      await dispatch(reloadPatient(patientId));
      navigateToPatient(patientId);
    },
    [dispatch, navigateToPatient],
  );

  if (!recentlyViewedPatients?.length) {
    return null;
  }

  return (
    <article data-testid="container-791z" {...props}>
      {!isDashboard && (
        <ContainerTitle
          aria-controls={collapseId}
          aria-expanded={isExpanded}
          data-testid="containertitle-zwrx"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <SectionLabel data-testid="sectionlabel-ybkl">
            <TranslatedText
              stringId="patientList.recentlyViewed.title"
              fallback="Recently viewed"
            />
          </SectionLabel>
          <DisclosureIcon />
        </ContainerTitle>
      )}
      <Collapse
        data-testid="collapse-q5zd"
        id={collapseId}
        in={isExpanded}
        timeout="auto"
        unmountOnExit
      >
        <CardListContainer $isDashboard={isDashboard} data-testid="cardlistcontainer-skdl">
          {isDashboard && (
            <SectionTitle data-testid="sectiontitle-frit">
              <TranslatedText
                stringId="patientList.recentlyViewed.title"
                fallback="Recently viewed"
              />
            </SectionTitle>
          )}
          {pageIndex > 0 ? (
            <LeftArrowButton onClick={() => changePage(-1)} data-testid="leftarrowbutton-tjtk">
              <NavigateBefore data-testid="navigatebefore-5m41" />
            </LeftArrowButton>
          ) : (
            <MarginDiv data-testid="margindiv-pxqe" />
          )}
          <UnorderedList data-testid="cardlist-zxcl" $columnCount={patientPerPage}>
            {recentlyViewedPatients
              .slice(pageIndex * patientPerPage, (pageIndex + 1) * patientPerPage)
              .map((patient, index) => (
                <Card
                  key={patient.id}
                  patient={patient}
                  handleClick={cardOnClick}
                  isDashboard={isDashboard}
                  index={index}
                />
              ))}
          </UnorderedList>
          {pageIndex < pageCount - 1 ? (
            <RightArrowButton onClick={() => changePage(1)} data-testid="rightarrowbutton-jva4">
              <NavigateNext data-testid="navigatenext-zeo2" />
            </RightArrowButton>
          ) : (
            <MarginDiv data-testid="margindiv-7km8" />
          )}
        </CardListContainer>
      </Collapse>
    </article>
  );
};
