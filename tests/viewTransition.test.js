import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionView } from '../src/utils/viewTransition.js';

test('View Transitions Utility', async (t) => {
  await t.test('calls callback immediately when document.startViewTransition is absent', () => {
    let executed = false;
    transitionView(() => {
      executed = true;
    });
    assert.equal(executed, true);
  });

  await t.test('delegates to document.startViewTransition when present', () => {
    let startViewTransitionCalled = false;
    let callbackExecuted = false;

    globalThis.document = {
      startViewTransition: (cb) => {
        startViewTransitionCalled = true;
        cb();
      }
    };

    transitionView(() => {
      callbackExecuted = true;
    });

    assert.equal(startViewTransitionCalled, true);
    assert.equal(callbackExecuted, true);

    delete globalThis.document;
  });
});
