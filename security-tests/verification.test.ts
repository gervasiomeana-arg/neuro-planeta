import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verificationFailure, verificationResponse } from '../server/commercial/verification';
import { createApiApp } from '../server/app';
import { commercialConfig } from '../server/commercial/config';

test('invalid sessions stay denied while ADC/IAM/network failures never masquerade as a bad login or leak provider details', () => {
  for (const code of ['auth/id-token-revoked', 'auth/id-token-expired', 'auth/invalid-id-token','auth/user-disabled']) assert.equal(verificationResponse({ code }).status,401);
  for (const code of ['auth/insufficient-permission', 'app/invalid-credential', 'auth/invalid-credential', 'ENOTFOUND', 7, 16]) {
    const result = verificationResponse({ code, message:'private credential and user token', details:'private-project-id' });
    assert.equal(result.status,503); assert.doesNotMatch(JSON.stringify(result), /private credential|private-project-id|user token/);
  }
  assert.equal(verificationFailure({ code:7 },'database').reason,'FIREBASE_DATABASE_PERMISSION');
  assert.equal(verificationFailure({ code:'auth/insufficient-permission' }).reason,'FIREBASE_AUTH_PERMISSION');
  assert.equal(verificationResponse(new Error('private')).body.code,'FIREBASE_UNAVAILABLE');
});
test('a server verification failure stops the HTTP route before diagnostics, data reads or any mutation', async () => {
  let verificationError: unknown = { code:'auth/insufficient-permission' }, laterCalls = 0;
  const app = createApiApp({ production:false, commercial:{ config:commercialConfig({}), deps:{ async verify() { throw verificationError; }, async diagnose() { laterCalls++; throw Error('must not run'); }, privacy:{ consume:async()=>{ laterCalls++; return true; } } as any } } });
  const server=app.listen(0,'127.0.0.1'); await new Promise<void>(r=>server.once('listening',r));
  const addr=server.address();assert.ok(addr&&typeof addr!=='string');
  const run=()=>fetch(`http://127.0.0.1:${addr.port}/api/privacy/admin/diagnostics`,{headers:{Authorization:'Bearer fictional-token-for-tests-only'}});
  try {
    let response=await run();assert.equal(response.status,503);assert.equal((await response.json()).code,'FIREBASE_AUTH_PERMISSION');assert.equal(laterCalls,0);
    verificationError={ code:'auth/id-token-revoked' }; response=await run();assert.equal(response.status,401);assert.equal(laterCalls,0);
    verificationError=verificationFailure({code:7},'database'); response=await run();assert.equal(response.status,503);assert.equal((await response.json()).code,'FIREBASE_DATABASE_PERMISSION');assert.equal(laterCalls,0);
  } finally { await new Promise<void>(r=>server.close(()=>r())); }
});
