import React, { type ComponentProps, type ReactElement, useState } from 'react';
import Accordion from 'react-native-collapsible/Accordion';
import { StyledScrollView } from '/styled/common';
import { Header } from './Header';
import { Content } from './Content';

/**
 * `Accordion` calls `renderContent` as a plain function from a class component's render, so
 * it must not be a function component. React Compiler applies memoisation smarts to
 * `Content`, which inserts a `useMemoCache` call that would violate the rules of hooks if
 * `Content` were called as a plain function. (`Header` takes three parameters, so React
 * Compiler doesn't treat it as a component.)
 */
function renderContent(section: ComponentProps<typeof Content>) {
  return <Content data={section.data} />;
}

export const PatientVaccineHistoryAccordion = ({ dataArray }): ReactElement => {
  const [activeSections, setActiveSections] = useState<number[]>([]);

  const updateSections = (newActiveSection: number[]): void => {
    setActiveSections(newActiveSection);
  };

  return (
    <StyledScrollView flex={1} width="100%">
      <Accordion
        sections={dataArray}
        underlayColor="transparent"
        activeSections={activeSections}
        renderHeader={Header}
        renderContent={renderContent}
        onChange={updateSections}
      />
    </StyledScrollView>
  );
};
