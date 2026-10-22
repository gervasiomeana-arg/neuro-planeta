import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RECOVERY_MESSAGE, recoveryErrorMessage } from '../src/auth/accountFeedback';

test('recovery does not reveal account existence or internal provider errors', () => {
  for (const error of [{ code: 'auth/user-not-found' }, { code: 'auth/invalid-email' }, { code: 'auth/internal-error', message: 'secret diagnostic' }, null, new Error('private')]) {
    assert.equal(recoveryErrorMessage(error), RECOVERY_MESSAGE);
  }
});
test('recovery distinguishes only actionable network and quota failures', () => {
  assert.match(recoveryErrorMessage({ code: 'auth/network-request-failed' }), /conexión/);
  assert.match(recoveryErrorMessage({ code: 'auth/too-many-requests' }), /demasiados intentos/);
});
