import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Collapse, Divider, IconButton, ListItem, Typography } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { ExpandLess, ExpandMore, NavigateBefore, NavigateNext } from '@material-ui/icons';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { reloadPatient } from '../store/patient';
import { useApi } from '../api';
import { Colors } from '../constants/styles';
import { DateDisplay } from './DateDisplay';
import { ThemedTooltip } from './Tooltip';
import { TranslatedSex, TranslatedText } from './Translation';

const colorFromEncounterType = {
  admission: Colors.green,
  clinic: '#E9AC50',
  triage: Colors.orange,
  observation: Colors.orange,
  emergency: Colors.orange,
  default: Colors.blue,
};

function getPatientStatusColor({ $encounterType, $isPatientDeceased }) {
  if ($isPatientDeceased) {
    return Colors.midText;
  }

  return colorFromEncounterType[$encounterType || 'default'] || colorFromEncounterType.default;
}

const ComponentDivider = styled(Divider)`
  margin: 10px 30px 0px 30px;
  background-color: ${Colors.outline};
`;

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.palette.text.primary};
  letter-spacing: 0;
  text-transform: none;
  text-decoration: none;
`;

const CardComponent = styled.div`
  padding: 10px;
  padding-bottom: 15px;
  width: ${(p) => (p.patientPerPage === 4 ? '25%' : '16%')};
  margin-left: 1%;
  background-color: white;
  border-radius: 3px;
  display: flex;
  flex-direction: row;
  cursor: pointer;
  &:hover {
    background-color: ${Colors.hoverGrey};
  }
  &:first-child {
    margin-left: 0;
  }
  ${(p) =>
    p.$isDashboard
      ? `border: 1px solid ${Colors.outline};
      height: 100px;
    `
      : ''}
`;

const CardComponentContent = styled.div`
  min-width: 0;
`;

const CardList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-top: 10px;
`;

const CardListContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  ${(p) =>
    p.$isDashboard
      ? `background-color: ${Colors.white};
    margin-left: 20px;
    margin-right: 20px;
    border: 1px solid ${Colors.outline};
    padding-bottom: 10px;`
      : ''}
`;

const CardTitle = styled(Typography)`
  font-weight: bold;
  font-size: 14px;
  color: ${getPatientStatusColor};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardText = styled(Typography)`
  font-size: 14px;
`;

const CapitalizedCardText = styled(CardText)`
  text-transform: capitalize;
`;

const PatientStatusIndicator = styled.div`
  height: 75%;
  border-radius: 10px;
  width: 4px;
  min-width: 4px;
  margin-right: 5px;
  background-color: ${getPatientStatusColor};
`;

const Container = styled(ListItem)`
  grid-area: patients;
  margin: 10px 0px 20px 0px;
  display: block;
  position: inherit;
  padding: 0;
  &.MuiListItem-root {
    width: auto;
  }
`;

const ContainerTitle = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  margin-left: 30px;
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

const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  padding-left: 24px;
  flex: 0 0 82px;
  align-self: flex-start;
  padding-top: 12px;
`;

const PATIENTS_PER_PAGE = 6;

const Card = ({ patient, handleClick, patientPerPage, isDashboard, index }) => {
  const isPatientDeceased = Boolean(patient.dateOfDeath);

  return (
    <CardComponent
      onClick={() => handleClick(patient.id)}
      patientPerPage={patientPerPage}
      $isDashboard={isDashboard}
      data-testid={`cardcomponent-j39j-${index}`}
    >
      <PatientStatusIndicator
        $encounterType={patient.encounter_type}
        $isPatientDeceased={isPatientDeceased}
        data-testid={`patientstatusindicator-a5ir-${index}`}
      />
      <CardComponentContent data-testid={`cardcomponentcontent-${index}`}>
        <ThemedTooltip
          title={`${patient.firstName || ''} ${patient.lastName || ''}`}
          data-testid="themedtooltip-i98w"
        >
          <CardTitle
            $encounterType={patient.encounter_type}
            $isPatientDeceased={isPatientDeceased}
            $isDashboard={isDashboard}
            data-testid={`cardtitle-qqhk-${index}`}
          >
            {patient.firstName} {patient.lastName}
          </CardTitle>
        </ThemedTooltip>
        <CardText $isDashboard={isDashboard} data-testid={`cardtext-iro1-${index}`}>
          {patient.displayId}
        </CardText>
        <CapitalizedCardText
          $isDashboard={isDashboard}
          data-testid={`capitalizedcardtext-zu58-${index}`}
        >
          <TranslatedSex sex={patient.sex} data-testid={`translatedsex-zkco-${index}`} />
        </CapitalizedCardText>
        <CardText $isDashboard={isDashboard} data-testid={`cardtext-i2bu-${index}`}>
          <TranslatedText
            stringId="general.dateOfBirth.label.short"
            fallback="DOB"
            data-testid={`translatedtext-7ljq-${index}`}
          />
          :{' '}
          <DateDisplay
            date={patient.dateOfBirth}
            shortYear
            data-testid={`datedisplay-tw5s-${index}`}
          />
        </CardText>
      </CardComponentContent>
    </CardComponent>
  );
};

export const RecentlyViewedPatientsList = ({
  encounterType,
  isDashboard = false,
  patientPerPage = PATIENTS_PER_PAGE,
}) => {
  const { navigateToPatient } = usePatientNavigation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  const dispatch = useDispatch();
  const api = useApi();

  const { data: { data: recentlyViewedPatients = [] } = {} } = useQuery(
    ['recentlyViewedPatients', encounterType],
    () => api.get('user/recently-viewed-patients', { encounterType }),
  );

  const pageCount = Math.ceil(recentlyViewedPatients?.length / patientPerPage);
  const changePage = (delta) =>
    setPageIndex(Math.max(0, Math.min(pageCount - 1, pageIndex + delta)));

  const cardOnClick = useCallback(
    async (patientId) => {
      await dispatch(reloadPatient(patientId));
      navigateToPatient(patientId);
    },
    [dispatch, navigateToPatient],
  );

  if (!recentlyViewedPatients?.length) {
    return null;
  }

  return (
    <Container data-testid="container-791z">
      <ContainerTitle onClick={() => setIsExpanded(!isExpanded)} data-testid="containertitle-zwrx">
        {!isDashboard && (
          <>
            <SectionLabel data-testid="sectionlabel-ybkl">
              <TranslatedText
                stringId="patientList.recentlyViewed.title"
                fallback="Recently viewed"
                data-testid="translatedtext-lobc"
              />
            </SectionLabel>
            {isExpanded ? (
              <ExpandLess data-testid="expandless-4fci" />
            ) : (
              <ExpandMore data-testid="expandmore-mi2c" />
            )}
          </>
        )}
      </ContainerTitle>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit data-testid="collapse-q5zd">
        <CardListContainer $isDashboard={isDashboard} data-testid="cardlistcontainer-skdl">
          {isDashboard && (
            <SectionTitle data-testid="sectiontitle-frit">
              <TranslatedText
                stringId="patientList.recentlyViewed.title"
                fallback="Recently viewed"
                data-testid="translatedtext-dyvm"
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
          <CardList data-testid="cardlist-zxcl">
            {recentlyViewedPatients
              .slice(pageIndex * patientPerPage, (pageIndex + 1) * patientPerPage)
              .map((patient, index) => (
                <Card
                  key={patient.id}
                  patient={patient}
                  handleClick={cardOnClick}
                  isDashboard={isDashboard}
                  patientPerPage={patientPerPage}
                  index={index}
                />
              ))}
          </CardList>
          {pageIndex < pageCount - 1 ? (
            <RightArrowButton onClick={() => changePage(1)} data-testid="rightarrowbutton-jva4">
              <NavigateNext data-testid="navigatenext-zeo2" />
            </RightArrowButton>
          ) : (
            <MarginDiv data-testid="margindiv-7km8" />
          )}
        </CardListContainer>
      </Collapse>
      {!isExpanded && <ComponentDivider data-testid="componentdivider-ciq5" />}
    </Container>
  );
};
