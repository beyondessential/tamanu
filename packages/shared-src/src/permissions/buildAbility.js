import { AbilityBuilder, Ability } from '@casl/ability';

export function buildAbility(definition) {
  const { can, build } = new AbilityBuilder(Ability);

  const { actions = [], surveys = {}, reports = {} } = definition;

  // Set up actions -- just an array of noun/verb pairs without options
  actions.forEach(a => can(a.verb, a.noun));

  // Set up reports -- just a list of codes we are allowed to run
  // We're using a different verb here because a Report is not a db object
  // and running a report can result in read operations on any part of the db,
  // it's not the same as "read Report", which would just be getting the name
  // of the report and its associated options. 
  if (reports.run) {
    can('run', 'Report', { code: { $in: reports.run } }); 
  }

  // Set up surveys -- some we can submit, some we can only view.
  // One doesn't imply the other, for eg a nurse might be recording surveys 
  // that contain sensitive information but should not be able to see 
  // previous responses to that survey.
  // We're using different verbs here because they don't map directly to
  // CRUD operations or database objects.
  // (the relevant db objects are SurveyResponse + SurveyResponseAnswer,
  // but the check is actually on the `code` field of Survey)
  if (surveys.submit) {
    can('submit', 'Survey', { code: { $in: surveys.submit } });
  }
  if (surveys.view) {
    can('view', 'Survey', { code: { $in: surveys.view } });
  }

  return build({
    // TODO: what is correct here? same on FE & BE? use Model:getModelName()?
    // are we ok to use the default (this.constructor.name) -- `shared` is 
    // currently not minified but if that changes, this may break. 
    // -- What does sequelize use? Can we just use that?
    detectSubjectType: obj => {
      if (typeof obj === "string") {
        return obj;
      }
      return obj?.type;
    }
  });
}
