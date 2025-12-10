import React from 'react';
import { useListOfProgramRegistryQuery } from '../../api/queries/useProgramRegistryQuery';
import { PrimarySidebarItem } from '../../components/Sidebar/PrimarySidebarItem';
import { SecondarySidebarItem } from '../../components/Sidebar/SecondarySidebarItem';
import { TranslatedReferenceData } from '../../components/Translation/TranslatedReferenceData';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';
import { useLocation, useNavigate } from 'react-router';

export const ProgramRegistrySidebarItem = ({
  icon,
  label,
  children,
  selected,
  highlighted,
  onClick,
  divider,
  retracted,
  path,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const { data: programRegistries, isLoading, isError } = useListOfProgramRegistryQuery();

  if (isError || isLoading || programRegistries.data.length === 0) return null;

  return (
    <PrimarySidebarItem
      {...{ icon, label, children, selected, highlighted, onClick, divider, retracted, path }}
      data-testid="primarysidebaritem-kx7z"
    >
      {programRegistries.data.map(({ id, name }, index) => {
        const baseSecondaryPath = `${path}/${id}`;
        const secondaryPath = `${baseSecondaryPath}?name=${name}`;
        return !retracted ? (
          <NoteModalActionBlocker key={id}>
            <SecondarySidebarItem
              path={secondaryPath}
              isCurrent={currentPath.includes(baseSecondaryPath)}
              color=""
              label={
                <TranslatedReferenceData
                  value={id}
                  fallback={name}
                  category="programRegistry"
                  data-testid={`translatedreferencedata-2dpm-${index}`}
                />
              }
              disabled={false}
              onClick={() => navigate(secondaryPath)}
              data-testid={`secondarysidebaritem-3uo3-${index}`}
            />
          </NoteModalActionBlocker>
        ) : null;
      })}
    </PrimarySidebarItem>
  );
};
