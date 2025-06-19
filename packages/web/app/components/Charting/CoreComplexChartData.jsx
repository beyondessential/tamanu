import React, { useState } from 'react';
import styled from 'styled-components';

import { useAuth } from '../../contexts/Auth';
import { TranslatedText } from '../Translation';
import { DeleteChartModal } from '../DeleteChartModal';
import { Colors } from '../../constants';
import { MenuButton } from '../MenuButton';
import { CHARTING_DATA_ELEMENT_IDS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { useEncounter } from '../../contexts/Encounter';
import { useEncounterChartsQuery } from '../../api/queries';

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
  handleDeleteChart,
  selectedSurveyId,
  currentInstanceId,
  date,
  type,
  subtype,
  fieldVisibility,
}) => {
  const { ability } = useAuth();
  const [open, setModalOpen] = useState(false);
  const { encounter } = useEncounter();
  const { data } = useEncounterChartsQuery(encounter.id, selectedSurveyId, currentInstanceId);
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
        return ability?.can('delete', 'Charting');
      },
    },
  ];

  const isTypeVisible =
    fieldVisibility[CHARTING_DATA_ELEMENT_IDS.complexChartType] === VISIBILITY_STATUSES.CURRENT;
  const isSubtypeVisible =
    fieldVisibility[CHARTING_DATA_ELEMENT_IDS.complexChartSubtype] === VISIBILITY_STATUSES.CURRENT;
    
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
              <TranslatedText
                stringId="complexChartInstance.date"
                fallback="Date & time of onset:"
                data-testid="translatedtext-moh0"
              />
            </CoreComplexChartInfoHeader>
            <>{date}</>
          </CoreComplexChartSingleInfoWrapper>

          {isTypeVisible ? (
            <CoreComplexChartSingleInfoWrapper data-testid="corecomplexchartsingleinfowrapper-2jla">
              <CoreComplexChartInfoHeader data-testid="corecomplexchartinfoheader-4k95">
                <TranslatedText
                  stringId="complexChartInstance.type"
                  fallback="Type:"
                  data-testid="translatedtext-4z04"
                />
              </CoreComplexChartInfoHeader>

              <>{type || '-'}</>
            </CoreComplexChartSingleInfoWrapper>
          ) : null}

          {isSubtypeVisible ? (
            <CoreComplexChartSingleInfoWrapper data-testid="corecomplexchartsingleinfowrapper-h7z6">
              <CoreComplexChartInfoHeader data-testid="corecomplexchartinfoheader-bgio">
                <TranslatedText
                  stringId="complexChartInstance.subtype"
                  fallback="Sub type:"
                  data-testid="translatedtext-9x05"
                />
              </CoreComplexChartInfoHeader>
              <>{subtype || '-'}</>
            </CoreComplexChartSingleInfoWrapper>
          ) : null}
        </CoreComplexChartInfoWrapper>
        {data.length === 0 ? <MenuButton actions={actions} data-testid="menubutton-ypvb" /> : null}
      </CoreComplexChartDataRow>
    </>
  );
};
