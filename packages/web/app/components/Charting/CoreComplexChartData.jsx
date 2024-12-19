import React, { useState } from 'react';
import styled from 'styled-components';

import { useAuth } from '../../contexts/Auth';
import { TranslatedText } from '../Translation';
import { DeleteChartModal } from '../DeleteChartModal';
import { Colors } from '../../constants';
import { MenuButton } from '../MenuButton';
import { CHARTING_DATA_ELEMENT_IDS, VISIBILITY_STATUSES } from '@tamanu/constants';

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
  date,
  type,
  subtype,
  fieldVisibility,
}) => {
  const { ability } = useAuth();
  const [open, setModalOpen] = useState(false);
  const actions = [
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
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
      />
      <CoreComplexChartDataRow role="group">
        <CoreComplexChartInfoWrapper>
          <CoreComplexChartSingleInfoWrapper>
            <CoreComplexChartInfoHeader>
              <TranslatedText
                stringId="complexChartInstance.date"
                fallback="Date & time of onset:"
              />
            </CoreComplexChartInfoHeader>
            <>{date}</>
          </CoreComplexChartSingleInfoWrapper>

          {isTypeVisible ? (
            <CoreComplexChartSingleInfoWrapper>
              <CoreComplexChartInfoHeader>
                <TranslatedText stringId="complexChartInstance.type" fallback="Type:" />
              </CoreComplexChartInfoHeader>

              <>{type || '-'}</>
            </CoreComplexChartSingleInfoWrapper>
          ) : null}

          {isSubtypeVisible ? (
            <CoreComplexChartSingleInfoWrapper>
              <CoreComplexChartInfoHeader>
                <TranslatedText stringId="complexChartInstance.subtype" fallback="Sub type:" />
              </CoreComplexChartInfoHeader>
              <>{subtype || '-'}</>
            </CoreComplexChartSingleInfoWrapper>
          ) : null}
        </CoreComplexChartInfoWrapper>
        <MenuButton actions={actions} />
      </CoreComplexChartDataRow>
    </>
  );
};
