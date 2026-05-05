import { createTestContext } from '../utilities';

jest.setTimeout(120 * 1000);

const programDefinition = {
  title: 'Referral form',
  programCode: 'ncd',
  programName: 'NCD',
  surveys: [
    {
      code: 'referral',
      name: 'Referral form',
      surveyType: 'programs',
      status: 'draft',
    },
  ],
  surveySheets: [
    {
      surveyName: 'Referral form',
      questions: [
        {
          code: 'referral001',
          name: 'referral001',
          text: 'Patient name',
          type: 'FreeText',
          newScreen: true,
        },
      ],
    },
  ],
};

describe('Form Builder Admin', () => {
  let ctx;
  let app;
  let forbiddenApp;
  let aiService;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asNewRole([['write', 'FormBuilder']]);
    forbiddenApp = await ctx.baseApp.asNewRole([]);
  });

  beforeEach(() => {
    aiService = {
      createSession: jest.fn().mockResolvedValue('new-session-id'),
      sendFormBuilderMessage: jest.fn().mockResolvedValue({
        message: 'AI response',
        attach_to_program_code: 'ncd',
        ready_to_export: false,
        ready_to_generate: false,
      }),
      getSessionTranscript: jest.fn().mockResolvedValue('[human]\nBuild a referral form'),
      invokeStructured: jest.fn().mockResolvedValue(programDefinition),
      interpretFormBuilderImage: jest.fn().mockResolvedValue('SECTION: Referral\nQUESTION: Patient name'),
      registerFormBuilderContext: jest.fn().mockResolvedValue(undefined),
    };
    ctx.aiService = aiService;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('sends a text chat message through the AI service', async () => {
    const response = await app.post('/v1/admin/form-builder/chat').send({
      message: 'Build a referral form',
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toEqual({
      sessionId: 'new-session-id',
      message: 'AI response',
      attachToProgramCode: 'ncd',
      readyToExport: false,
      readyToGenerate: false,
      programDefinition: null,
    });
    expect(aiService.createSession).toHaveBeenCalledWith('formBuilder');
    expect(aiService.sendFormBuilderMessage).toHaveBeenCalledWith(
      'new-session-id',
      'Build a referral form',
    );
  });

  it('reuses an existing AI session', async () => {
    const response = await app.post('/v1/admin/form-builder/chat').send({
      sessionId: 'existing-session-id',
      message: 'Add a mandatory date field',
    });

    expect(response).toHaveSucceeded();
    expect(aiService.createSession).not.toHaveBeenCalled();
    expect(aiService.sendFormBuilderMessage).toHaveBeenCalledWith(
      'existing-session-id',
      'Add a mandatory date field',
    );
  });

  it('includes uploaded file text in the AI message', async () => {
    const response = await app
      .post('/v1/admin/form-builder/chat')
      .field('jsonData', JSON.stringify({ message: 'Use this form' }))
      .attach('file', Buffer.from('Patient name\nDate of referral'), 'form.txt');

    expect(response).toHaveSucceeded();
    expect(aiService.sendFormBuilderMessage).toHaveBeenCalledWith(
      'new-session-id',
      '[TEXT DOCUMENT LOADED]\nPatient name\nDate of referral\n\nUse this form',
    );
  });

  it('interprets uploaded images using the form builder image prompt', async () => {
    const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const response = await app
      .post('/v1/admin/form-builder/chat')
      .field('jsonData', JSON.stringify({ message: 'Use this image' }))
      .attach('file', imageBuffer, 'form.png');

    expect(response).toHaveSucceeded();
    expect(aiService.interpretFormBuilderImage).toHaveBeenCalledWith({
      imageBase64: imageBuffer.toString('base64'),
      mediaType: 'image/png',
      fileName: 'form.png',
    });
    expect(aiService.sendFormBuilderMessage).toHaveBeenCalledWith(
      'new-session-id',
      '[FORM IMAGE INTERPRETED]\nSECTION: Referral\nQUESTION: Patient name\n\nUse this image',
    );
  });

  it('generates a program definition for the ready to export state', async () => {
    aiService.sendFormBuilderMessage.mockResolvedValueOnce({
      message: 'Your form is ready to export.',
      attach_to_program_code: 'ncd',
      ready_to_export: true,
      ready_to_generate: false,
    });

    const response = await app.post('/v1/admin/form-builder/chat').send({
      message: 'Export this form',
    });

    expect(response).toHaveSucceeded();
    expect(aiService.getSessionTranscript).toHaveBeenCalledWith('new-session-id');
    expect(aiService.invokeStructured).toHaveBeenCalledWith(
      'formBuilderBuildSurveyDefinition',
      '[human]\nBuild a referral form',
      expect.any(Object),
      { name: 'form_builder_program_definition' },
    );
    expect(response.body).toMatchObject({
      readyToExport: true,
      programDefinition,
    });
  });

  it('requires write FormBuilder permission', async () => {
    const response = await forbiddenApp.post('/v1/admin/form-builder/chat').send({
      message: 'Build a referral form',
    });

    expect(response).toBeForbidden();
    expect(aiService.sendFormBuilderMessage).not.toHaveBeenCalled();
  });
});
