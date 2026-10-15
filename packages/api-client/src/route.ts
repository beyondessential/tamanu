// A path template plus its path parameters, kept together and passed as the
// endpoint argument to any TamanuApi verb. The template stays a literal with
// `:name` placeholders all the way to `fetch`, which expands and encodes it
// centrally — so browser telemetry can group requests by the route pattern and
// record the resolved parameters separately, instead of only ever seeing a
// concrete, flattened path.
//
//   api.get(route('patient/:patientId/allergies', { patientId }), query)
//
// A plain string endpoint keeps working unchanged; `route()` is opt-in.

// Keyed via the global symbol registry so the brand survives even if two copies
// of this module end up in a bundle (instanceof would not).
const ROUTE_BRAND = Symbol.for('@tamanu/api-client:RouteDescriptor');

export interface RouteDescriptor {
  readonly [ROUTE_BRAND]: true;
  readonly template: string;
  readonly params: Record<string, string | number>;
}

export type Endpoint = string | RouteDescriptor;

export function isRouteDescriptor(value: unknown): value is RouteDescriptor {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[ROUTE_BRAND] === true
  );
}

// Drops a trailing query string so placeholders are only read from the path part
// (a template rarely carries a query, but a verb with no query channel may).
type WithoutQuery<Template extends string> = Template extends `${infer Path}?${string}`
  ? Path
  : Template;

// Extracts the `:name` placeholder names from a template at the type level, so
// the params object is checked to have exactly one value per placeholder.
type PlaceholderNames<Template extends string> =
  Template extends `${string}:${infer AfterColon}`
    ? AfterColon extends `${infer Name}/${infer Rest}`
      ? Name | PlaceholderNames<Rest>
      : AfterColon
    : never;

type PathParamNames<Template extends string> = PlaceholderNames<WithoutQuery<Template>>;

type RouteParams<Template extends string> = {
  [Name in PathParamNames<Template>]: string | number;
};

// A template with no placeholders takes no params argument; one with
// placeholders requires the matching params object.
type RouteParamsArg<Template extends string> =
  PathParamNames<Template> extends never ? [] : [params: RouteParams<Template>];

export function route<Template extends string>(
  template: Template,
  ...params: RouteParamsArg<Template>
): RouteDescriptor {
  return {
    [ROUTE_BRAND]: true,
    template,
    params: (params[0] ?? {}) as Record<string, string | number>,
  };
}

const PLACEHOLDER = /:([A-Za-z0-9_]+)/g;

// Expands a descriptor into a concrete path, URL-encoding each value. Throws if
// a placeholder has no value or a value has no placeholder, so a typo at the
// call site surfaces immediately rather than silently producing a wrong URL.
export function expandRoute({ template, params }: RouteDescriptor): string {
  const used = new Set<string>();
  const path = template.replace(PLACEHOLDER, (_match, name: string) => {
    if (!(name in params)) {
      throw new Error(`Route template "${template}" has no value for :${name}`);
    }
    used.add(name);
    return encodeURIComponent(String(params[name]));
  });

  const unused = Object.keys(params).filter(name => !used.has(name));
  if (unused.length > 0) {
    throw new Error(
      `Route params [${unused.join(', ')}] are not present in template "${template}"`,
    );
  }

  return path;
}
