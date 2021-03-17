import React, { useCallback, useState } from 'react';
import Accordion from 'react-native-collapsible/Accordion';
import { StyledView } from '/styled/common';
import Header from './Header';
import { HistoryTable } from '../HistoryTable';

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

  return (
    <StyledView flex={1} width="100%">
      <Accordion
        sections={dataArray}
        underlayColor="transparent"
        activeSections={activeSections}
        renderHeader={Header}
        renderContent={content}
        onChange={updateSections}
      />
    </StyledView>
  );
};
