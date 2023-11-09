import { fake } from '@tamanu/shared/test-helpers';
import { NUM_FACILITIES, REF_ID_PREFIX } from '../constants';

export default {
  run: async store => {
    const { Facility, Department, LocationGroup, Location } = store.models;
    const facDepLoc = [];
    for (let i = 0; i < NUM_FACILITIES; i++) {
      const [facility] = await Facility.upsert(
        {
          ...fake(Facility),
          id: `${REF_ID_PREFIX}-facility-${i}`,
        },
        { returning: true },
      );
      const [department] = await Department.upsert(
        {
          ...fake(Department),
          id: `${REF_ID_PREFIX}-department-${i}`,
          facilityId: facility.id,
        },
        { returning: true },
      );
      const [locationGroup] = await LocationGroup.upsert(
        fake(LocationGroup, {
          id: `${REF_ID_PREFIX}-locationGroup-${i}`,
          facilityId: facility.id,
        }),
        { returning: true },
      );
      const [location] = await Location.upsert(
        fake(Location, {
          id: `${REF_ID_PREFIX}-location-${i}`,
          facilityId: facility.id,
          locationGroupId: locationGroup.id,
        }),
        { returning: true },
      );
      facDepLoc.push([facility, department, location]);
    }
    return facDepLoc;
  },
};
