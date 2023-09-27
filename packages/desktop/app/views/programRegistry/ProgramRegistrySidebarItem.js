import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useApi } from '../../api';
import { PrimarySidebarItem } from '../../components/Sidebar/PrimarySidebarItem';
import { SecondarySidebarItem } from '../../components/Sidebar/SecondarySidebarItem';
import { getCurrentRoute } from '../../store/router';
import { programRegistriesForInfoPaneList } from '../../../stories/utils/mockProgramRegistryData';

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
  const api = useApi();
  const dispatch = useDispatch();
  const onPathChanged = newPath => dispatch(push(newPath));
  const currentPath = useSelector(getCurrentRoute);

  const [programRegistries, setProgramRegistries] = useState([]);
  useEffect(() => {
    (async () => {
      const response = await api.get('programRegistries');
      if (response.data.length > 0) setProgramRegistries(response.data);
    })();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      {programRegistries.length > 0 ? (
        <PrimarySidebarItem
          {...{ icon, label, children, selected, highlighted, onClick, divider, retracted }}
        >
          {programRegistries.map((x, i) => {
            const secondaryPath = `${path}/${x.code}`;
            return (
              <SecondarySidebarItem
                key={x.code}
                path={secondaryPath}
                isCurrent={currentPath.includes(secondaryPath)}
                color={''}
                label={x.name}
                disabled={false}
                onClick={() => onPathChanged(secondaryPath)}
              />
            );
          })}
        </PrimarySidebarItem>
      ) : (
        <></>
      )}
    </>
  );
};
