import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { PatientInfoPane } from '../components/PatientInfoPane';
import { PatientNavigation } from '../components/PatientNavigation';
import { TwoColumnDisplay } from '../components/TwoColumnDisplay';
import { usePatientRouteMap } from '../utils/usePatientRouteMap';

const isPathUnchanged = (prevProps, nextProps) => prevProps.match.path === nextProps.match.path;

const RouteWithSubRoutes = ({ path, component, routes }) => (
  <>
    <Route exact path={path} component={component} />
    {routes?.map(subRoute => (
      <RouteWithSubRoutes key={`route-${subRoute.path}`} {...subRoute} />
    ))}
  </>
);

export const PatientRoutes = React.memo(() => {
  const routeMap = usePatientRouteMap();
  return (
    <TwoColumnDisplay>
      <PatientInfoPane />
      <div style={{ overflow: 'hidden' }}>
        <PatientNavigation routeMap={routeMap} />
        <Switch>
          {routeMap.map(route => (
            <RouteWithSubRoutes key={`route-${route.path}`} {...route} />
          ))}
        </Switch>
      </div>
    </TwoColumnDisplay>
  );
}, isPathUnchanged);
