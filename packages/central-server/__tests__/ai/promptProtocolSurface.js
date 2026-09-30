import { toJsonSchema } from '@langchain/core/utils/json_schema';

import { AI_CONTEXT_NAMES, AI_PROMPT_PROTOCOL } from '@tamanu/constants';

import { formBuilderTweakResponseSchema } from '../../app/admin/formBuilder';
import { programDefinitionSchema } from '../../app/admin/programImporter/programDefinition';
import { formBuilderChatResponseSchema } from '../../app/services/AIService';

// The structured-output schema each context's response is bound to.
const OUTPUT_SCHEMAS = {
  [AI_CONTEXT_NAMES.FORM_BUILDER]: formBuilderChatResponseSchema,
  [AI_CONTEXT_NAMES.FORM_BUILDER_BUILD]: programDefinitionSchema,
  [AI_CONTEXT_NAMES.FORM_BUILDER_TWEAK]: formBuilderTweakResponseSchema,
};

const resolveRef = (rootSchema, ref) =>
  ref
    .replace(/^#\//, '')
    .split('/')
    .reduce((node, segment) => node?.[segment], rootSchema);

/**
 * Flatten a JSON schema into the field paths a prompt can refer to, e.g.
 * `surveySheets[].questions[].code`, plus each literal value a field is
 * constrained to, e.g. `operations[].type=updateSurvey`.
 */
const collectOutputFieldPaths = (rootSchema, schema, path, paths, refsInProgress = new Set()) => {
  if (!schema || typeof schema !== 'object') return;

  if (schema.$ref) {
    if (refsInProgress.has(schema.$ref)) return;
    const withRef = new Set(refsInProgress).add(schema.$ref);
    collectOutputFieldPaths(rootSchema, resolveRef(rootSchema, schema.$ref), path, paths, withRef);
    return;
  }

  for (const branches of [schema.anyOf, schema.oneOf, schema.allOf]) {
    branches?.forEach(branch =>
      collectOutputFieldPaths(rootSchema, branch, path, paths, refsInProgress),
    );
  }

  const literalValues = schema.const === undefined ? schema.enum : [schema.const];
  literalValues?.forEach(value => paths.add(`${path}=${value}`));

  Object.entries(schema.properties ?? {}).forEach(([key, propertySchema]) => {
    const propertyPath = path ? `${path}.${key}` : key;
    paths.add(propertyPath);
    collectOutputFieldPaths(rootSchema, propertySchema, propertyPath, paths, refsInProgress);
  });

  const itemSchemas = [schema.items, schema.prefixItems].flat().filter(Boolean);
  itemSchemas.forEach(itemSchema =>
    collectOutputFieldPaths(rootSchema, itemSchema, `${path}[]`, paths, refsInProgress),
  );
};

const getOutputFieldPaths = outputSchema => {
  if (!outputSchema) return [];
  // The conversion withStructuredOutput uses to build the tool the model is sent.
  const jsonSchema = toJsonSchema(outputSchema);
  const paths = new Set();
  collectOutputFieldPaths(jsonSchema, jsonSchema, '', paths);
  return [...paths];
};

/**
 * Every protocol token the code currently relies on, per AI context: delimiter
 * tags as `<tag>`, markers as written, and structured-output field paths.
 *
 * @returns {Record<string, string[]>}
 */
export const getPromptProtocolSurface = () =>
  Object.fromEntries(
    Object.values(AI_CONTEXT_NAMES).map(contextName => {
      // A context missing from AI_PROMPT_PROTOCOL is reported by its own test
      // rather than crashing collection here.
      const { tags = [], markers = [] } = AI_PROMPT_PROTOCOL[contextName] ?? {};
      const tokens = [
        ...tags.map(tag => `<${tag}>`),
        ...markers,
        ...getOutputFieldPaths(OUTPUT_SCHEMAS[contextName]),
      ];
      return [contextName, [...new Set(tokens)].sort()];
    }),
  );
