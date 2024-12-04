import React, { useState } from 'react';
import styled from 'styled-components';

import { useAuth } from '../../contexts/Auth';
import { TranslatedText } from '../Translation';
import { DeleteChartModal } from '../DeleteChartModal';
import { Colors } from '../../constants';
import { MenuButton } from '../MenuButton';

const CoreComplexChartDataRow = styled.div`
  margin-bottom: 20px;
  font-size: 14px;
  padding-top: 15px;
  border-top: 1px solid ${Colors.outline};
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

export const CoreComplexChartData = ({ handleDeleteChart, date, type, subType }) => {
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

          <CoreComplexChartSingleInfoWrapper>
            <CoreComplexChartInfoHeader>
              <TranslatedText stringId="complexChartInstance.type" fallback="Type:" />
            </CoreComplexChartInfoHeader>

            <>{type || '-'}</>
          </CoreComplexChartSingleInfoWrapper>

          <CoreComplexChartSingleInfoWrapper>
            <CoreComplexChartInfoHeader>
              <TranslatedText stringId="complexChartInstance.subType" fallback="Sub type:" />
            </CoreComplexChartInfoHeader>
            <>{subType || '-'}</>
          </CoreComplexChartSingleInfoWrapper>
        </CoreComplexChartInfoWrapper>
        <MenuButton actions={actions} />
      </CoreComplexChartDataRow>
    </>
  );
};
