import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { PatientNavigation } from '../components/PatientNavigation';
import { usePatientRouteMap } from '../utils/usePatientRouteMap';

function areEqualPathnames(prevProps, nextProps) {
  return prevProps.location.pathname === nextProps.location.pathname;
}

export const PatientRoutes = React.memo(() => {
  const routeMap = usePatientRouteMap();
  return (
    <>
      <PatientNavigation routeMap={routeMap} />
      <Switch>
        {routeMap.map(route => (
          <RouteWithSubRoutes key={route.path} {...route} />
        ))}
      </Switch>
    </>
  );
}, areEqualPathnames);

function RouteWithSubRoutes({ path, component, routes }) {
  return (
    <>
      <Route exact path={path} component={component} />
      {routes?.map(childRoute => (
        <RouteWithSubRoutes key={childRoute.path} {...childRoute} />
      ))}
    </>
  );
}
