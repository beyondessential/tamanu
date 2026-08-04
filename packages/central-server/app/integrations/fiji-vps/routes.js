import { fhirRoutes } from '../../hl7fhir';

export const routes = async ctx => fhirRoutes(ctx, await ctx.settings.get('integrations.fijiVps'));
