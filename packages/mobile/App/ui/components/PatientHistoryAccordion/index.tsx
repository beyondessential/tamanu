import React, { useCallback, useState } from 'react';
import Accordion from 'react-native-collapsible/Accordion';
import { StyledScrollView } from '/styled/common';
import Header from './Header';
import { HistoryTable } from '../HistoryTable';
import { Spacer } from '../Spacer';

interface AccordionListProps {
  dataArray: VisitOverviewProps[];
  rows: object;
}

export const PatientHistoryAccordion = ({
  dataArray,
  rows,
}: AccordionListProps): JSX.Element => {
  const [activeSections, setActiveSections] = useState<number[]>([]);

  const updateSections = (newActiveSection: number[]): void => {
    setActiveSections(newActiveSection);
  };

  const content = useCallback(
    (section) => <HistoryTable data={section} rows={rows} />,
    [dataArray, rows],
  );

  const keyExtractor = useCallback((item) => item.id, [dataArray]);

  return (
    <StyledScrollView flex={1} width="100%">
      <Accordion
        sections={dataArray}
        underlayColor="transparent"
        activeSections={activeSections}
        renderHeader={Header}
        renderContent={content}
        onChange={updateSections}
        keyExtractor={keyExtractor}
      />
      <Spacer height="80px" />
    </StyledScrollView>
  );
};
