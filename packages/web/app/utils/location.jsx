import React from 'react';
import { TranslatedReferenceData } from "../components/Translation/TranslatedReferenceData";

/**
 * @param location: { name: string, locationGroup: { name: string } }
 * @returns {string}
 */

export const getFullLocationName = location => {
  // Attempt to return the location group name and the location name. eg. Ward 2, Bed 1
  if (location?.locationGroup?.name) {
    return <>
      <span>
        <TranslatedReferenceData fallback={location.locationGroup.name} value={location.locationGroup.id} category="locationGroup"/>
      </span>
      {", "}
      <span>
        <TranslatedReferenceData fallback={location.name} value={location.id} category="location"/>
      </span>
    </>
  }

  if (location?.name) {
    return <TranslatedReferenceData fallback={location.name} value={location.id} category="location"/>;
  }

  return '-';
};
