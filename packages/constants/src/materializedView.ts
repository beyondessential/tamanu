import { WS_EVENTS } from './webSocket';

export const MATERIALIZED_VIEWS = {
  UPCOMING_VACCINATIONS: 'upcomingVaccinations',
};

export const MATERIALIZED_VIEW_REFRESHED_AT_KEYS = {
  [MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS]: 'upcomingVaccinationsRefreshedAt',
};

export const MATERIALIZED_VIEW_REFRESH_CONFIG = {
  [MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS]: {
    refreshEvent: WS_EVENTS.UPCOMING_VACCINATIONS_REFRESHED,
    refreshedAtKey: MATERIALIZED_VIEW_REFRESHED_AT_KEYS[MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS],
    statsEndpoint: 'upcomingVaccinations/refreshStats',
  },
};
