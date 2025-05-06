import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { ENCOUNTER_TYPES, SETTING_KEYS } from '@tamanu/constants';
import { useUserPreferencesMutation } from '../../api/mutations/useUserPreferencesMutation';
import { useEncounter } from '../../contexts/Encounter';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { ContentPane, EncounterTopBar, NoteBlock } from '../../components';
import { DiagnosisView } from '../../components/DiagnosisView';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useApi } from '../../api';
import {
  DocumentsPane,
  EncounterInfoPane,
  EncounterMedicationPane,
  EncounterProgramsPane,
  ImagingPane,
  EncounterInvoicingPane,
  LabsPane,
  NotesPane,
  ProcedurePane,
  VitalsPane,
  ChartsPane,
  TasksPane,
} from './panes';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../../constants';
import { ENCOUNTER_TAB_NAMES } from '../../constants/encounterTabNames';
import { EncounterActions } from './components';
import { useReferenceDataQuery } from '../../api/queries';
import { useAuth } from '../../contexts/Auth';
import { TranslatedText, TranslatedReferenceData } from '../../components/Translation';
import { useSettings } from '../../contexts/Settings';
import { EncounterPaneWithPermissionCheck } from './panes/EncounterPaneWithPermissionCheck';
import { TabDisplayDraggable } from '../../components/TabDisplayDraggable';
import { useUserPreferencesQuery } from '../../api/queries/useUserPreferencesQuery';
import { isEqual } from 'lodash';
import { ChartDataProvider } from '../../contexts/ChartData';

const getIsTriage = encounter => ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].triageFlowOnly;

const TABS = [
  {
    label: <TranslatedText stringId="encounter.tabs.tasks" fallback="tasks" />,
    key: ENCOUNTER_TAB_NAMES.TASKS,
    render: props => (
      <EncounterPaneWithPermissionCheck permissionNoun="Tasking">
        <TasksPane {...props} />
      </EncounterPaneWithPermissionCheck>
    ),
    condition: getSetting => getSetting('features.enableTasking'),
  },
  {
    label: <TranslatedText stringId="encounter.tabs.vitals" fallback="Vitals" />,
    key: ENCOUNTER_TAB_NAMES.VITALS,
    render: props => <VitalsPane {...props} />,
  },
  {
    label: <TranslatedText stringId="encounter.tabs.charts" fallback="Charts" />,
    key: ENCOUNTER_TAB_NAMES.CHARTS,
    render: props => (
      <ChartDataProvider>
        <ChartsPane {...props} />
      </ChartDataProvider>
    ),
    condition: getSetting => getSetting(SETTING_KEYS.FEATURES_DESKTOP_CHARTING_ENABLED),
  },
  {
    label: <TranslatedText stringId="encounter.tabs.notes" fallback="Notes" />,
    key: ENCOUNTER_TAB_NAMES.NOTES,
    render: props => <NotesPane {...props} />,
  },
  {
    label: <TranslatedText stringId="encounter.tabs.procedures" fallback="Procedures" />,
    key: ENCOUNTER_TAB_NAMES.PROCEDURES,
    render: props => <ProcedurePane {...props} />,
  },
  {
    label: <TranslatedText stringId="encounter.tabs.labs" fallback="Labs" />,
    key: ENCOUNTER_TAB_NAMES.LABS,
    render: props => <LabsPane {...props} />,
  },
  {
    label: <TranslatedText stringId="encounter.tabs.imaging" fallback="Imaging" />,
    key: ENCOUNTER_TAB_NAMES.IMAGING,
    render: props => <ImagingPane {...props} />,
  },
  {
    label: <TranslatedText stringId="encounter.tabs.medication" fallback="Medication" />,
    key: ENCOUNTER_TAB_NAMES.MEDICATION,
    render: props => <EncounterMedicationPane {...props} />,
  },
  {
    label: <TranslatedText stringId="encounter.tabs.forms" fallback="Forms" />,
    key: ENCOUNTER_TAB_NAMES.FORMS,
    render: props => <EncounterProgramsPane {...props} />,
  },
  {
    label: <TranslatedText stringId="encounter.tabs.documents" fallback="Documents" />,
    key: ENCOUNTER_TAB_NAMES.DOCUMENTS,
    render: props => <DocumentsPane {...props} />,
  },
  {
    label: <TranslatedText stringId="encounter.tabs.invoicing" fallback="Invoicing" />,
    key: ENCOUNTER_TAB_NAMES.INVOICING,
    render: props => (
      <EncounterPaneWithPermissionCheck permissionNoun="Invoice">
        <EncounterInvoicingPane {...props} />
      </EncounterPaneWithPermissionCheck>
    ),
    condition: getSetting => getSetting('features.enableInvoicing'),
  },
];

function getHeaderText({ encounterType }) {
  switch (encounterType) {
    case ENCOUNTER_TYPES.TRIAGE:
      return <TranslatedText stringId="encounter.type.triage" fallback="Triage" />;
    case ENCOUNTER_TYPES.OBSERVATION:
      return <TranslatedText stringId="encounter.type.observation" fallback="Active ED patient" />;
    case ENCOUNTER_TYPES.EMERGENCY:
      return <TranslatedText stringId="encounter.type.emergency" fallback="Emergency short stay" />;
    case ENCOUNTER_TYPES.ADMISSION:
      return <TranslatedText stringId="encounter.type.admission" fallback="Hospital admission" />;
    case ENCOUNTER_TYPES.CLINIC:
    case ENCOUNTER_TYPES.IMAGING:
    default:
      return (
        <TranslatedText stringId="encounter.header.patientEncounter" fallback="Patient Encounter" />
      );
  }
}

const GridColumnContainer = styled.div`
  // set min-width to 0 to stop the grid column getting bigger than it's parent
  // as grid column children default to min-width: auto @see https://www.w3.org/TR/css3-grid-layout/#min-size-auto
  min-width: 0;
`;

const StyledTabDisplayDraggable = styled(TabDisplayDraggable)`
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
  const { getSetting } = useSettings();
  const { facilityId } = useAuth();
  const patient = useSelector(state => state.patient);
  const { encounter, isLoadingEncounter } = useEncounter();
  const { data: patientBillingTypeData } = useReferenceDataQuery(encounter?.patientBillingTypeId);
  const { data: userPreferences, isLoading: isLoadingUserPreferences } = useUserPreferencesQuery();
  const { mutate: reorderEncounterTabs } = useUserPreferencesMutation();

  const [currentTab, setCurrentTab] = useState(query.get('tab'));
  const [tabs, setTabs] = useState(TABS);
  const disabled = encounter?.endDate || !!patient.dateOfDeath;

  const visibleTabs = tabs.filter(tab => !tab.condition || tab.condition(getSetting));

  useEffect(() => {
    api.post(`user/recently-viewed-patients/${patient.id}`);
  }, [api, patient.id]);

  useEffect(() => {
    if (!userPreferences?.encounterTabOrders) return;
    if (!currentTab) {
      setCurrentTab(visibleTabs[0].key);
    }
    const newTabs = visibleTabs.sort((a, b) => {
      const aOrder = userPreferences?.encounterTabOrders[a.key] || 0;
      const bOrder = userPreferences?.encounterTabOrders[b.key] || 0;
      return aOrder - bOrder;
    });
    if (!isEqual(newTabs, tabs)) {
      setTabs([...newTabs]);
    }
  }, [userPreferences?.encounterTabOrders]);

  useEffect(() => {
    if (!currentTab) {
      setCurrentTab(visibleTabs[0].key);
    }
  }, [isLoadingUserPreferences]);

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  const handleDragEnd = result => {
    if (!result.destination) {
      return;
    }

    const currentVisibleTabs = visibleTabs;
    const newTabs = reorder(currentVisibleTabs, result.source.index, result.destination.index);
    setTabs([...newTabs]);

    const newTabOrders = newTabs.reduce((curr, tab, index) => {
      curr[tab.key] = index + 1;
      return curr;
    }, {});
    reorderEncounterTabs(
      { key: 'encounterTabOrders', value: newTabOrders },
      {
        onError: () => setTabs(currentVisibleTabs),
      },
    );
  };

  if (!encounter || isLoadingEncounter || patient.loading) return <LoadingIndicator />;

  return (
    <GridColumnContainer>
      <EncounterTopBar
        title={getHeaderText(encounter)}
        subTitle={
          encounter.location?.facility && (
            <TranslatedReferenceData
              fallback={encounter.location.facility.name}
              value={encounter.location.facility.id}
              category="facility"
            />
          )
        }
        encounter={encounter}
      >
        {(facilityId === encounter.location.facilityId || encounter.endDate) &&
          // Hide all actions if encounter type is Vaccination or Survey Response,
          // as they should only contain 1 survey response or vaccination and discharged automatically,
          // no need to show any summaries or actions
          ![ENCOUNTER_TYPES.VACCINATION, ENCOUNTER_TYPES.SURVEY_RESPONSE].includes(
            encounter.encounterType,
          ) && <EncounterActions encounter={encounter} />}
      </EncounterTopBar>
      <EncounterInfoPane
        encounter={encounter}
        getSetting={getSetting}
        patientBillingType={
          patientBillingTypeData && (
            <TranslatedReferenceData
              fallback={patientBillingTypeData.name}
              value={patientBillingTypeData.id}
              category="patientBillingType"
            />
          )
        }
      />
      <DiagnosisView encounter={encounter} isTriage={getIsTriage(encounter)} readOnly={disabled} />
      <ContentPane>
        <StyledTabDisplayDraggable
          tabs={visibleTabs}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          encounter={encounter}
          patient={patient}
          disabled={disabled}
          handleDragEnd={handleDragEnd}
        />
      </ContentPane>
    </GridColumnContainer>
  );
};
