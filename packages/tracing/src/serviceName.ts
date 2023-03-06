import { SemanticAttributes } from './semantics';

export function serviceName(context: { [key: string]: string }): string | null {
  if (!context[SemanticAttributes.DEPLOYMENT_NAME]) return null;

  return [
    context[SemanticAttributes.DEPLOYMENT_NAME],
    context[SemanticAttributes.SERVICE_TYPE],
    context[SemanticAttributes.DEPLOYMENT_FACILITY],
  ]
    .filter(Boolean)
    .join('-');
}
