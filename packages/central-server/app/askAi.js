import { createAskAiRouter, askAiPublicRouter } from '@tamanu/shared/services/askAiRouter';

export { askAiPublicRouter };
export const askAiRoutes = createAskAiRouter(req => req.settings.getFrontEndSettings());
