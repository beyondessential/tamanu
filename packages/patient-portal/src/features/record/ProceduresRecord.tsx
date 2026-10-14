import React from 'react';
import { TranslatedText } from '@tamanu/ui-components';
import type { Procedure } from '@tamanu/shared/schemas/patientPortal/responses/procedure.schema';

import { useProceduresQuery } from '@api/queries/useProceduresQuery';
import { formatRecordDate, RecordItem, RecordList, RecordSubsection } from './recordList';

const ProcedureItem = ({ procedure }: { procedure: Procedure }) => (
  <RecordItem
    title={procedure.procedureType?.name}
    details={[formatRecordDate(procedure.date), procedure.leadClinician?.displayName]}
  />
);

export const ProceduresRecord = () => {
  const { data: procedures, isLoading } = useProceduresQuery();
  const planned = procedures?.filter(procedure => !procedure.completed);
  const completed = procedures?.filter(procedure => procedure.completed);
  const none = <TranslatedText stringId="patientPortal.procedures.none" fallback="None recorded" />;

  return (
    <>
      <RecordSubsection
        id="planned-procedures"
        title={<TranslatedText stringId="patientPortal.procedures.planned" fallback="Planned" />}
      >
        <RecordList
          items={planned}
          isLoading={isLoading}
          empty={none}
          renderItem={procedure => <ProcedureItem key={procedure.id} procedure={procedure} />}
        />
      </RecordSubsection>
      <RecordSubsection
        id="completed-procedures"
        title={
          <TranslatedText stringId="patientPortal.procedures.completed" fallback="Completed" />
        }
      >
        <RecordList
          items={completed}
          isLoading={isLoading}
          empty={none}
          renderItem={procedure => <ProcedureItem key={procedure.id} procedure={procedure} />}
        />
      </RecordSubsection>
    </>
  );
};
