import { describe, expect, it } from '@jest/globals';
import { OutpatientDischarger } from "../../app/tasks/OutpatientDischarger";
import { createTestContext } from "../utilities";

describe('Jobs', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  describe('submitting a job', () => {
    it.todo('with defaults');
    it.todo('with a priority');
    it.todo('with a discriminant');
  });
  
  describe('running a job', () => {
    it.todo('successfully');
    it.todo('failing');
  });
  
  describe('processing the queue', () => {
    it.todo('jobs are processed by their topic');
    it.todo('jobs are processed in priority order');
    it.todo('a job that was never started is picked up again');
    it.todo('a job that was dropped is picked up again');
    it.todo('several jobs can be grabbed simultaneously');
  });  
});
