import React, { ReactElement, useCallback, useState } from 'react';
import Accordion from 'react-native-collapsible/Accordion';
import { StyledScrollView } from '/styled/common';
import Header from './Header';
import { HistoryTable } from '../HistoryTable';
import { HistoryTableRows } from '~/ui/interfaces/HistoryTable';
import { Spacer } from '../Spacer';
import { Encounter } from '~/models/Encounter';

interface AccordionListProps {
  dataArray: Encounter[];
  rows: HistoryTableRows;
}

export const PatientHistoryAccordion = ({
  dataArray,
  rows,
}: AccordionListProps): ReactElement => {
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
