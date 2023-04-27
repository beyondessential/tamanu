import { v4 as uuidv4 } from 'uuid';

import { formatFhirDate } from 'shared/utils/fhir/datetime';

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
    const timestamp = formatFhirDate(new Date());
    const fields = {
      resourceType: 'Bundle',
      id: uuidv4(),
      type: this.type,
      timestamp,
      meta: {
        // LEGACY: not explicitly required in the spec, and redundant with timestamp.
        // Candidate for removal at next version.
        lastUpdated: timestamp,
      },
    };

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
