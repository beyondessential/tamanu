import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import { TranslatedText } from '@tamanu/ui-components';
import { Article, TableScopeHeader, TableScopeSelect } from '../components';
import { useProgramsQuery } from './queries';

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

  const { data: programs, isLoading: isProgramsLoading } = useProgramsQuery({
    onSuccess: function defaultToFirst(data) {
      if (programId) return;
      const firstProgramId = data?.[0]?.id;
      if (!firstProgramId) return;
      switchToProgram(firstProgramId);
    },
  });
  const options = useMemo(
    () => programs?.map(({ id, name }) => ({ value: id, label: name })),
    [programs],
  );

  return (
    <Article>
      <TableScopeHeader>
        <TableScopeSelect
          aria-busy={isProgramsLoading}
          disabled={isProgramsLoading}
          label={
            <TranslatedText stringId="admin.programs.select.label" fallback="Select program" />
          }
          name="programId"
          onChange={e => switchToProgram(e.target.value)}
          options={options}
          value={programId ?? ''}
        />
      </TableScopeHeader>
    </Article>
  );
}
