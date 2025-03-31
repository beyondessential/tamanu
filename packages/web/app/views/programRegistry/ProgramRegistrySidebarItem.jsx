import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useListOfProgramRegistryQuery } from '../../api/queries/useProgramRegistryQuery';
import { PrimarySidebarItem } from '../../components/Sidebar/PrimarySidebarItem';
import { SecondarySidebarItem } from '../../components/Sidebar/SecondarySidebarItem';
import { getCurrentRoute } from '../../store/router';
import { TranslatedReferenceData } from '../../components/Translation/TranslatedReferenceData';

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
      {...{ icon, label, children, selected, highlighted, onClick, divider, retracted }}
    >
      {programRegistries.data.map(({ id, name }) => {
        const secondaryPath = `${path}/${id}?name=${name}`;
        return !retracted ? (
          <SecondarySidebarItem
            key={id}
            path={secondaryPath}
            isCurrent={currentPath.includes(secondaryPath)}
            color=""
            label={
              <TranslatedReferenceData
                value={id}
                fallback={name}
                category="programRegistry"
                data-testid='translatedreferencedata-l5tf' />
            }
            disabled={false}
            onClick={() => onPathChanged(secondaryPath)}
          />
        ) : null;
      })}
    </PrimarySidebarItem>
  );
};
