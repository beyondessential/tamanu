import { createTestContext } from '../utilities';

jest.setTimeout(120 * 1000);

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
      sendMessage: jest.fn().mockResolvedValue({ content: 'AI response' }),
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
    });
    expect(aiService.createSession).toHaveBeenCalledWith('formBuilder');
    expect(aiService.sendMessage).toHaveBeenCalledWith('new-session-id', 'Build a referral form');
  });

  it('reuses an existing AI session', async () => {
    const response = await app.post('/v1/admin/form-builder/chat').send({
      sessionId: 'existing-session-id',
      message: 'Add a mandatory date field',
    });

    expect(response).toHaveSucceeded();
    expect(aiService.createSession).not.toHaveBeenCalled();
    expect(aiService.sendMessage).toHaveBeenCalledWith(
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
    expect(aiService.sendMessage).toHaveBeenCalledWith(
      'new-session-id',
      '[TEXT DOCUMENT LOADED]\nPatient name\nDate of referral\n\nUse this form',
    );
  });

  it('requires write FormBuilder permission', async () => {
    const response = await forbiddenApp.post('/v1/admin/form-builder/chat').send({
      message: 'Build a referral form',
    });

    expect(response).toBeForbidden();
    expect(aiService.sendMessage).not.toHaveBeenCalled();
  });
});
