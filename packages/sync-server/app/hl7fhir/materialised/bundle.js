import { v4 as uuidv4 } from 'uuid';

import { FHIR_DATETIME_PRECISION } from 'shared/constants/fhir';
import { latestDateTime } from 'shared/utils/dateTime';
import { formatDateTime } from 'shared/utils/fhir/datetime';

import { getBaseUrl, getHL7Link } from '../utils';

export class Bundle {
  constructor(type, resources, options = {}) {
    this.type = type;
    this.resources = resources;
    this.options = options;
  }

  addSelfUrl(req) {
    const baseUrl = getBaseUrl(req);
    this.options.selfurl = getHL7Link(baseUrl, req.query);
  }

  asFhir() {
    const fields = {
      resourceType: 'Bundle',
      id: uuidv4(),
      type: this.type,
      timestamp: formatDateTime(new Date(), FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE),
    };

    const latestUpdated = latestDateTime(...this.resources.map(r => new Date(r.lastUpdated)));
    if (latestUpdated) {
      fields.meta = {
        lastUpdated: formatDateTime(latestUpdated, FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE),
      };
    }

    if (typeof this.options.total === 'number') {
      fields.total = this.options.total;
    }

    if (this.options.link) {
      fields.link = this.options.link;
    }

    if (this.options.selfurl) {
      fields.link ||= [];
      fields.link.push({
        relation: 'self',
        url: this.options.selfurl,
      });
    }

    fields.entry = this.resources.map(r => {
      const fhir = r.asFhir();
      return {
        resource: fhir,
      };
    });

    return fields;
  }
}
