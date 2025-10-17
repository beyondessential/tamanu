import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { ENCOUNTER_TYPES, SETTING_KEYS } from '@tamanu/constants';
import { useUserPreferencesMutation } from '../../api/mutations/useUserPreferencesMutation';
import { useEncounter } from '../../contexts/Encounter';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { ContentPane, EncounterTopBar } from '../../components';
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
import { PlannedMoveActions } from './components/PlannedMoveActions';

const getIsTriage = encounter => ENCOUNTER_OPTIONS_BY_VALUE[encounter.encounterType].triageFlowOnly;

const TABS = [
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.tasks"
        fallback="tasks"
        data-testid="translatedtext-48go"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.TASKS,
    render: props => (
      <EncounterPaneWithPermissionCheck
        permissionNoun="Tasking"
        data-testid="encounterpanewithpermissioncheck-eiap"
      >
        <TasksPane {...props} data-testid="taskspane-s9f4" />
      </EncounterPaneWithPermissionCheck>
    ),
    condition: getSetting => getSetting('features.enableTasking'),
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.vitals"
        fallback="Vitals"
        data-testid="translatedtext-caxg"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.VITALS,
    render: props => <VitalsPane {...props} data-testid="vitalspane-vu7r" />,
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.charts"
        fallback="Charts"
        data-testid="translatedtext-8okl"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.CHARTS,
    render: props => (
      <ChartDataProvider data-testid="chartdataprovider-dwj3">
        <ChartsPane {...props} data-testid="chartspane-l442" />
      </ChartDataProvider>
    ),
    condition: getSetting => getSetting(SETTING_KEYS.FEATURES_DESKTOP_CHARTING_ENABLED),
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.notes"
        fallback="Notes"
        data-testid="translatedtext-8bc9"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.NOTES,
    render: props => <NotesPane {...props} data-testid="notespane-tzjl" />,
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.procedures"
        fallback="Procedures"
        data-testid="translatedtext-0v4k"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.PROCEDURES,
    render: props => <ProcedurePane {...props} data-testid="procedurepane-oy3x" />,
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.labs"
        fallback="Labs"
        data-testid="translatedtext-wuul"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.LABS,
    render: props => <LabsPane {...props} data-testid="labspane-4b0t" />,
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.imaging"
        fallback="Imaging"
        data-testid="translatedtext-w4o1"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.IMAGING,
    render: props => <ImagingPane {...props} data-testid="imagingpane-x8gy" />,
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.medication"
        fallback="Medication"
        data-testid="translatedtext-g9ps"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.MEDICATION,
    render: props => (
      <EncounterPaneWithPermissionCheck
        permissionNoun="Medication"
        data-testid="encounterpanewithpermissioncheck-g9ps"
      >
        <EncounterMedicationPane {...props} data-testid="encountermedicationpane-vij3" />
      </EncounterPaneWithPermissionCheck>
    ),
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.forms"
        fallback="Forms"
        data-testid="translatedtext-bxyg"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.FORMS,
    render: props => <EncounterProgramsPane {...props} data-testid="encounterprogramspane-knu4" />,
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.documents"
        fallback="Documents"
        data-testid="translatedtext-xn5g"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.DOCUMENTS,
    render: props => <DocumentsPane {...props} data-testid="documentspane-698w" />,
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.tabs.invoicing"
        fallback="Invoicing"
        data-testid="translatedtext-uoeh"
      />
    ),
    key: ENCOUNTER_TAB_NAMES.INVOICING,
    render: props => (
      <EncounterPaneWithPermissionCheck
        permissionNoun="Invoice"
        data-testid="encounterpanewithpermissioncheck-0zt7"
      >
        <EncounterInvoicingPane {...props} data-testid="encounterinvoicingpane-sci0" />
      </EncounterPaneWithPermissionCheck>
    ),
    condition: getSetting => getSetting('features.enableInvoicing'),
  },
];

function getHeaderText({ encounterType }) {
  switch (encounterType) {
    case ENCOUNTER_TYPES.TRIAGE:
      return (
        <TranslatedText
          stringId="encounter.type.triage"
          fallback="Triage"
          data-testid="translatedtext-e1f6"
        />
      );
    case ENCOUNTER_TYPES.OBSERVATION:
      return (
        <TranslatedText
          stringId="encounter.type.observation"
          fallback="Active ED patient"
          data-testid="translatedtext-l9uj"
        />
      );
    case ENCOUNTER_TYPES.EMERGENCY:
      return (
        <TranslatedText
          stringId="encounter.type.emergency"
          fallback="Emergency short stay"
          data-testid="translatedtext-9bww"
        />
      );
    case ENCOUNTER_TYPES.ADMISSION:
      return (
        <TranslatedText
          stringId="encounter.type.admission"
          fallback="Hospital admission"
          data-testid="translatedtext-h9l0"
        />
      );
    case ENCOUNTER_TYPES.CLINIC:
    case ENCOUNTER_TYPES.IMAGING:
    default:
      return (
        <TranslatedText
          stringId="encounter.header.patientEncounter"
          fallback="Patient Encounter"
          data-testid="translatedtext-6wvg"
        />
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

  if (!encounter || isLoadingEncounter || patient.loading)
    return <LoadingIndicator data-testid="loadingindicator-032s" />;

  return (
    <GridColumnContainer data-testid="gridcolumncontainer-vq5m">
      <EncounterTopBar
        title={getHeaderText(encounter)}
        subTitle={
          encounter.location?.facility && (
            <TranslatedReferenceData
              fallback={encounter.location.facility.name}
              value={encounter.location.facility.id}
              category="facility"
              data-testid="translatedreferencedata-dtq6"
            />
          )
        }
        encounter={encounter}
        data-testid="encountertopbar-bp4b"
      >
        {(facilityId === encounter.location.facilityId || encounter.endDate) &&
          // Hide all actions if encounter type is Vaccination or Survey Response,
          // as they should only contain 1 survey response or vaccination and discharged automatically,
          // no need to show any summaries or actions
          ![ENCOUNTER_TYPES.VACCINATION, ENCOUNTER_TYPES.SURVEY_RESPONSE].includes(
            encounter.encounterType,
          ) && <EncounterActions encounter={encounter} data-testid="encounteractions-8368" />}
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
              data-testid="translatedreferencedata-kkpj"
            />
          )
        }
        data-testid="encounterinfopane-nabb"
      />
      {encounter.plannedLocation && <PlannedMoveActions encounter={encounter} />}
      <DiagnosisView
        encounter={encounter}
        isTriage={getIsTriage(encounter)}
        readOnly={disabled}
        data-testid="diagnosisview-7r50"
      />
      <ContentPane data-testid="contentpane-nv12">
        <StyledTabDisplayDraggable
          tabs={visibleTabs}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          encounter={encounter}
          patient={patient}
          disabled={disabled}
          handleDragEnd={handleDragEnd}
          data-testid="styledtabdisplaydraggable-f593"
        />
      </ContentPane>
    </GridColumnContainer>
  );
};
