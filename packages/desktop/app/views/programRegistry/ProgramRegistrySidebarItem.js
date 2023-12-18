import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useListOfProgramRegistryQuery } from '../../api/queries/useProgramRegistryQuery';
import { PrimarySidebarItem } from '../../components/Sidebar/PrimarySidebarItem';
import { SecondarySidebarItem } from '../../components/Sidebar/SecondarySidebarItem';
import { getCurrentRoute } from '../../store/router';

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

  const { data: programRegistries } = useListOfProgramRegistryQuery();

  return (
    <>
      {programRegistries?.data && programRegistries?.data.length > 0 ? (
        <PrimarySidebarItem
          {...{ icon, label, children, selected, highlighted, onClick, divider, retracted }}
        >
          {programRegistries.data.map(x => {
            const secondaryPath = `${path}/${x.id}?name=${x.name}`;
            return !retracted ? (
              <SecondarySidebarItem
                key={x.id}
                path={secondaryPath}
                isCurrent={currentPath.includes(secondaryPath)}
                color=""
                label={x.name}
                disabled={false}
                onClick={() => onPathChanged(secondaryPath)}
              />
            ) : (
              <></>
            );
          })}
        </PrimarySidebarItem>
      ) : (
        <></>
      )}
    </>
  );
};
