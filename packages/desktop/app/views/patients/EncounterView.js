import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Divider, Box } from '@material-ui/core';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { useEncounter } from '../../contexts/Encounter';
import { useLocalisation } from '../../contexts/Localisation';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { EncounterTopBar, ContentPane } from '../../components';
import { DiagnosisView } from '../../components/DiagnosisView';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { TabDisplay } from '../../components/TabDisplay';
import { useApi } from '../../api';
import {
  VitalsPane,
  NotesPane,
  ProcedurePane,
  LabsPane,
  ImagingPane,
  EncounterMedicationPane,
  DocumentsPane,
  EncounterProgramsPane,
  InvoicingPane,
  EncounterInfoPane,
} from './panes';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../../constants';
import { ENCOUNTER_TAB_NAMES } from '../../constants/encounterTabNames';
import { EncounterActions } from './components';
import { useReferenceData } from '../../api/queries';
import { useAuth } from '../../contexts/Auth';
import { VitalChartDataProvider } from '../../contexts/VitalChartData';

const getIsTriage = encounter => ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].triageFlowOnly;

const TABS = [
  {
    label: 'Vitals',
    key: ENCOUNTER_TAB_NAMES.VITALS,
    render: props => (
      <VitalChartDataProvider>
        <VitalsPane {...props} />
      </VitalChartDataProvider>
    ),
  },
  {
    label: 'Notes',
    key: ENCOUNTER_TAB_NAMES.NOTES,
    render: props => <NotesPane {...props} />,
  },
  {
    label: 'Procedures',
    key: ENCOUNTER_TAB_NAMES.PROCEDURES,
    render: props => <ProcedurePane {...props} />,
  },
  {
    label: 'Labs',
    key: ENCOUNTER_TAB_NAMES.LABS,
    render: props => <LabsPane {...props} />,
  },
  {
    label: 'Imaging',
    key: ENCOUNTER_TAB_NAMES.IMAGING,
    render: props => <ImagingPane {...props} />,
  },
  {
    label: 'Medication',
    key: ENCOUNTER_TAB_NAMES.MEDICATION,
    render: props => <EncounterMedicationPane {...props} />,
  },
  {
    label: 'Programs',
    key: ENCOUNTER_TAB_NAMES.PROGRAMS,
    render: props => <EncounterProgramsPane {...props} />,
  },
  {
    label: 'Documents',
    key: 'documents',
    render: props => <DocumentsPane {...props} />,
  },
  {
    label: 'Invoicing',
    key: 'invoicing',
    render: props => <InvoicingPane {...props} />,
    condition: getLocalisation => getLocalisation('features.enableInvoicing'),
  },
];

function getHeaderText({ encounterType }) {
  switch (encounterType) {
    case ENCOUNTER_TYPES.TRIAGE:
      return 'Triage';
    case ENCOUNTER_TYPES.OBSERVATION:
      return 'Active ED patient';
    case ENCOUNTER_TYPES.EMERGENCY:
      return 'Emergency Short Stay';
    case ENCOUNTER_TYPES.ADMISSION:
      return 'Hospital Admission';
    case ENCOUNTER_TYPES.CLINIC:
    case ENCOUNTER_TYPES.IMAGING:
    default:
      return 'Patient Encounter';
  }
}

const GridColumnContainer = styled.div`
  // set min-width to 0 to stop the grid column getting bigger than it's parent
  // as grid column children default to min-width: auto @see https://www.w3.org/TR/css3-grid-layout/#min-size-auto
  min-width: 0;
`;

const StyledTabDisplay = styled(TabDisplay)`
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  background: white;

  .MuiTabs-root {
    margin-left: -12px;
  }

  .MuiTabs-scroller {
    border-bottom: 1px solid #ebebeb;
  }
`;

export const EncounterView = () => {
  const api = useApi();
  const query = useUrlSearchParams();
  const { getLocalisation } = useLocalisation();
  const { facility } = useAuth();
  const patient = useSelector(state => state.patient);
  const { encounter, isLoadingEncounter } = useEncounter();
  const { data: patientBillingTypeData } = useReferenceData(encounter?.patientBillingTypeId);
  const [currentTab, setCurrentTab] = useState(query.get('tab') || ENCOUNTER_TAB_NAMES.VITALS);
  const disabled = encounter?.endDate || patient.death;

  useEffect(() => {
    api.post(`user/recently-viewed-patients/${patient.id}`);
  }, [api, patient.id]);

  if (!encounter || isLoadingEncounter || patient.loading) return <LoadingIndicator />;

  const visibleTabs = TABS.filter(tab => !tab.condition || tab.condition(getLocalisation));

  return (
    <GridColumnContainer>
      <EncounterTopBar
        title={getHeaderText(encounter)}
        subTitle={encounter.location?.facility?.name}
        encounter={encounter}
      >
        {(facility.id === encounter.location.facilityId || encounter.endDate) &&
          // Hide all actions if encounter type is Vaccination or Survey Response,
          // as they should only contain 1 survey response or vaccination and discharged automatically,
          // no need to show any summaries or actions
          ![ENCOUNTER_TYPES.VACCINATION, ENCOUNTER_TYPES.SURVEY_RESPONSE].includes(
            encounter.encounterType,
          ) && <EncounterActions encounter={encounter} />}
      </EncounterTopBar>
      <ContentPane>
        <EncounterInfoPane
          encounter={encounter}
          getLocalisation={getLocalisation}
          patientBillingType={patientBillingTypeData?.name}
        />
        <Box mt={4} mb={4}>
          <Divider />
        </Box>
        <DiagnosisView
          encounter={encounter}
          isTriage={getIsTriage(encounter)}
          disabled={disabled}
        />
      </ContentPane>
      <ContentPane>
        <StyledTabDisplay
          tabs={visibleTabs}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          encounter={encounter}
          patient={patient}
          disabled={disabled}
        />
      </ContentPane>
    </GridColumnContainer>
  );
};
