import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import { TranslatedText } from '@tamanu/ui-components';
import { Article, TableScopeHeader, TableScopeSelect } from '../components';
import { useProgramQuery, useProgramsQuery } from './queries';

function programToOption(programs) {
  return programs?.map(({ id, name }) => ({ value: id, label: name }));
}

export function ManageProgramsAdminView() {
  const { programId } = useParams();
  const navigate = useNavigate();

  const switchToProgram = id => {
    const prev = programId ? String(programId) : '';
    const next = id ? String(id) : '';
    if (next === prev) return;
    const to = next
      ? `/admin/programs/programs/manage/${encodeURIComponent(next)}`
      : '/admin/programs/programs/manage';
    navigate(to);
  };

  const { data: options, isLoading: isOptionsLoading } = useProgramsQuery({
    onSuccess: function defaultToFirst(data) {
      if (programId) return;
      const firstProgramId = data?.[0]?.id;
      if (!firstProgramId) return;
      switchToProgram(firstProgramId);
    },
    select: programToOption,
  });

  const { isLoading: isProgramLoading } = useProgramQuery(programId);

  return (
    <Article>
      <TableScopeHeader>
        <TableScopeSelect
          aria-busy={isOptionsLoading}
          disabled={isOptionsLoading}
          label={
            <TranslatedText stringId="admin.programs.select.label" fallback="Select program" />
          }
          name="programId"
          onChange={e => switchToProgram(e.target.value)}
          options={options}
          value={programId ?? ''}
        />
        <div aria-busy={isProgramLoading} />
      </TableScopeHeader>
    </Article>
  );
}
