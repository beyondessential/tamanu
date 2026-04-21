import React, { useCallback, useEffect, useId, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';

import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import { ContentContainer } from '../../components/AdminViewContainer';
import { Article, TableScopeHeader, TableScopeSelect } from '../components';
import { ManageProgramSurveysTable } from './ManageProgramSurveysTable';
import { useProgramsQuery } from './queries';

const StyledArticle = styled(Article)`
  ${ContentContainer}:has(&) {
    background-color: ${TAMANU_COLORS.background2};
  }
`;

const StyledTableScopeHeader = styled(TableScopeHeader)`
  border-block-end-style: none;
`;

export function ManageProgramsAdminView() {
  const { programId } = useParams();
  const navigate = useNavigate();

  const switchToProgram = useCallback(
    id => {
      const prev = programId ? String(programId) : '';
      const next = id ? String(id) : '';
      if (next === prev) return;
      const to = next
        ? `/admin/programs/forms/manage/${encodeURIComponent(next)}`
        : '/admin/programs/forms/manage';
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

  const scopedTableId = useId();

  return (
    <StyledArticle>
      <StyledTableScopeHeader>
        <TableScopeSelect
          aria-busy={isProgramsLoading}
          // This aria-controls attribute gets attached to the MuiFormControl-root (default <div>),
          // but I couldn’t find any appropriate <select> (or any `role="combobox"` node) rendered
          // by react-select to forward it to.
          aria-controls={scopedTableId}
          disabled={isProgramsLoading}
          label={
            <TranslatedText stringId="admin.programs.select.label" fallback="Select program" />
          }
          name="programId"
          onChange={e => switchToProgram(e.target.value)}
          options={options}
          value={programId ?? ''}
        />
      </StyledTableScopeHeader>
      {programId ? (
        <ManageProgramSurveysTable id={scopedTableId} programId={programId} />
      ) : (
        <table id={scopedTableId} /> // Empty, but ensures aria-controls points to valid target
      )}
    </StyledArticle>
  );
}
