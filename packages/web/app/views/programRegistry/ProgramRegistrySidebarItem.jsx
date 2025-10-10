import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useListOfProgramRegistryQuery } from '../../api/queries/useProgramRegistryQuery';
import { PrimarySidebarItem } from '../../components/Sidebar/PrimarySidebarItem';
import { SecondarySidebarItem } from '../../components/Sidebar/SecondarySidebarItem';
import { getCurrentRoute } from '../../store/router';
import { TranslatedReferenceData } from '../../components/Translation/TranslatedReferenceData';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';

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
  const dispatch = useDispatch();
  const onPathChanged = newPath => dispatch(push(newPath));
  const currentPath = useSelector(getCurrentRoute);

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
              onClick={() => onPathChanged(secondaryPath)}
              data-testid={`secondarysidebaritem-3uo3-${index}`}
            />
          </NoteModalActionBlocker>
        ) : null;
      })}
    </PrimarySidebarItem>
  );
};
