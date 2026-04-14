import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import { TranslatedText } from '@tamanu/ui-components';
import { Article, TableScopeHeader, TableScopeSelect } from '../components';
import { useProgramsQuery } from './queries';

export function ManageProgramsAdminView() {
  const { programId } = useParams();
  const navigate = useNavigate();

  const switchToProgram = useCallback(
    id => {
      const prev = programId ? String(programId) : '';
      const next = id ? String(id) : '';
      if (next === prev) return;
      const to = next
        ? `/admin/programs/programs/manage/${encodeURIComponent(next)}`
        : '/admin/programs/programs/manage';
      navigate(to);
    },
    [navigate, programId],
  );

  const { data: programs, isLoading: isProgramsLoading } = useProgramsQuery();

  const options = useMemo(
    () => programs?.map(({ id, name }) => ({ value: id, label: name })),
    [programs],
  );

  useEffect(
    function defaultToFirst() {
      if (programId) return; // Only if no existing selection
      if (!programs?.[0]) return; // Wait for query data, short-circuit if no options
      switchToProgram(programs[0].id);
    },
    [programId, programs, switchToProgram],
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
