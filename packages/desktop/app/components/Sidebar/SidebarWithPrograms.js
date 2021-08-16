import React, { useEffect, useState, memo } from 'react';
import { find } from 'lodash';
import { submenuIcons } from './config';
import { Sidebar } from './Sidebar';

// TODO fetch programs from api
const DUMMY_PROGRAM = { name: 'All programs', id: 'all-programs' };
const fetchPrograms = async () => [DUMMY_PROGRAM];

export const SidebarWithPrograms = memo(({ items, ...restOfProps }) => {
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    (async () => {
      const programList = await fetchPrograms();
      setPrograms(programList);
    })();
  }, []); // [] means it will run only once, on first mount

  // only enable new Appointments page in development
  const itemsWithPrograms = items.filter(
    i => i.key !== 'appointments' || process.env.NODE_ENV === 'development',
  );
  const programsNav = find(itemsWithPrograms, { key: 'programs' });
  if (programs.length > 0) {
    programsNav.hidden = false;
    programsNav.children = programs.map(({ name, id }) => ({
      label: name,
      path: `/programs/${id}/patients`,
      icon: submenuIcons.action,
    }));
  }

  return <Sidebar items={itemsWithPrograms} {...restOfProps} />;
});
