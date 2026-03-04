import React, { useState } from 'react';
import styled from 'styled-components';
import { subject } from '@casl/ability';

import { useAuth } from '../../contexts/Auth';
import { TranslatedReferenceData, TranslatedText } from '../Translation';
import { DeleteChartModal } from '../DeleteChartModal';
import { Colors } from '../../constants';
import { MenuButton } from '../MenuButton';
import { CHARTING_DATA_ELEMENT_IDS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { useEncounter } from '../../contexts/Encounter';
import { useEncounterChartsQuery } from '../../api/queries';
import { DateDisplay } from '../DateDisplay';
import { NoteModalActionBlocker } from '../NoteModalActionBlocker';

const CoreComplexChartDataRow = styled.div`
  margin-bottom: 10px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
`;

const CoreComplexChartInfoWrapper = styled.div`
  display: inline-flex;
  margin-top: 5px;
`;

const CoreComplexChartInfoHeader = styled.span`
  font-weight: 500;
  margin-right: 5px;
  color: ${Colors.darkestText};
`;

const CoreComplexChartSingleInfoWrapper = styled.span`
  margin-right: 20px;
  color: ${Colors.darkText};
`;

export const CoreComplexChartData = ({
  coreComplexChartSurveyId,
  handleDeleteChart,
  selectedSurveyId,
  currentInstanceId,
  date,
  type,
  subtype,
  fieldVisibility,
  coreComplexDataElements,
  canDeleteInstance,
  isPatientRemoved = false,
}) => {
  const { ability } = useAuth();
  const [open, setModalOpen] = useState(false);
  const { encounter } = useEncounter();
  const { data } = useEncounterChartsQuery(encounter?.id, selectedSurveyId, currentInstanceId);
  const actions = [
    {
      label: (
        <TranslatedText
          stringId="general.action.delete"
          fallback="Delete"
          data-testid="translatedtext-3r78"
        />
      ),
      action: () => setModalOpen(true),
      permissionCheck: () => {
        return !isPatientRemoved && ability?.can('delete', subject('Charting', { id: coreComplexChartSurveyId }));
      },
      wrapper: action => <NoteModalActionBlocker>{action}</NoteModalActionBlocker>,
    },
  ].filter(({ permissionCheck }) => {
    return permissionCheck ? permissionCheck() : true;
  });

  const isFieldVisible = (value, fieldId) =>
    !!value || fieldVisibility[fieldId] === VISIBILITY_STATUSES.CURRENT;

  const isTypeVisible = isFieldVisible(type, CHARTING_DATA_ELEMENT_IDS.complexChartType);
  const isSubtypeVisible = isFieldVisible(subtype, CHARTING_DATA_ELEMENT_IDS.complexChartSubtype);
  const showMenuButton =
    (typeof canDeleteInstance === 'boolean' ? canDeleteInstance : data.length === 0) &&
    actions.length > 0;

  const { dateDataElement, typeDataElement, subtypeDataElement } = coreComplexDataElements;

  return (
    <>
      <DeleteChartModal
        open={open}
        onClose={() => setModalOpen(false)}
        handleDeleteChart={handleDeleteChart}
        data-testid="deletechartmodal-tg82"
      />
      <CoreComplexChartDataRow role="group" data-testid="corecomplexchartdatarow-df90">
        <CoreComplexChartInfoWrapper data-testid="corecomplexchartinfowrapper-zn2k">
          <CoreComplexChartSingleInfoWrapper data-testid="corecomplexchartsingleinfowrapper-qen9">
            <CoreComplexChartInfoHeader data-testid="corecomplexchartinfoheader-a7s5">
              <TranslatedReferenceData
                category="programDataElement"
                value={dateDataElement?.id}
                fallback={dateDataElement?.name}
                data-testid="translatedreferencedata-moh0"
              />
              {dateDataElement ? ':' : null}
            </CoreComplexChartInfoHeader>
            <DateDisplay date={date} showTime data-testid="datedisplay-hnbz" />
          </CoreComplexChartSingleInfoWrapper>

          {isTypeVisible ? (
            <CoreComplexChartSingleInfoWrapper data-testid="corecomplexchartsingleinfowrapper-2jla">
              <CoreComplexChartInfoHeader data-testid="corecomplexchartinfoheader-4k95">
                <TranslatedReferenceData
                  category="programDataElement"
                  value={typeDataElement?.id}
                  fallback={typeDataElement?.name}
                  data-testid="translatedreferencedata-4z04"
                />
                {typeDataElement ? ':' : null}
              </CoreComplexChartInfoHeader>

              <>{type || '-'}</>
            </CoreComplexChartSingleInfoWrapper>
          ) : null}

          {isSubtypeVisible ? (
            <CoreComplexChartSingleInfoWrapper data-testid="corecomplexchartsingleinfowrapper-h7z6">
              <CoreComplexChartInfoHeader data-testid="corecomplexchartinfoheader-bgio">
                <TranslatedReferenceData
                  category="programDataElement"
                  value={subtypeDataElement?.id}
                  fallback={subtypeDataElement?.name}
                  data-testid="translatedreferencedata-9x05"
                />
                {subtypeDataElement ? ':' : null}
              </CoreComplexChartInfoHeader>
              <>{subtype || '-'}</>
            </CoreComplexChartSingleInfoWrapper>
          ) : null}
        </CoreComplexChartInfoWrapper>
        {showMenuButton ? <MenuButton actions={actions} data-testid="menubutton-ypvb" /> : null}
      </CoreComplexChartDataRow>
    </>
  );
};
