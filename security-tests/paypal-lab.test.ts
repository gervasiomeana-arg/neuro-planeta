import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LabRepository, labConfig, labHandler, previewOrigin } from '../scripts/paypal-lab';
import { BillingService } from '../server/commercial/service';
import { PayPalClient, type Json } from '../server/commercial/paypal';

const PLAN='P-FICTIONAL123456789', SUB='I-FICTIONAL123', ORIGIN='https://8080-fictional.cloudshell.dev';
const config=labConfig(ORIGIN,'fictional-id','fictional-secret',PLAN);
const account={uid:'sandbox-lab-only',email:'',admin:false,authTime:Date.now()};
const plan={status:'ACTIVE',billing_cycles:[{tenure_type:'REGULAR',frequency:{interval_unit:'MONTH',interval_count:1},total_cycles:0,pricing_scheme:{fixed_price:{value:'20.00',currency_code:'USD'}}}],payment_preferences:{auto_bill_outstanding:false}};
const directory=()=>mkdtempSync(join(tmpdir(),'neuro-lab-'));

test('lab accepts only Cloud Shell preview origin and fixed sandbox mode',()=>{
  assert.equal(previewOrigin('fictional.cloudshell.dev'),ORIGIN);
  for(const host of ['evil.invalid','x.cloudshell.dev.evil.invalid','x.cloudshell.dev:443','https://x.cloudshell.dev','x.cloudshell.dev/path'])assert.throws(()=>previewOrigin(host));
  assert.equal(new PayPalClient(config).host,'https://api-m.sandbox.paypal.com');
  assert.equal(config.legalReady,false);assert.equal(config.address,'');assert.equal(config.supportEmail,'');
  assert.throws(()=>labConfig(ORIGIN,'id','secret','invalid'));
});

test('lab account is persisted privately and refuses changed app, plan, corrupt data and another user',async()=>{
  const dir=directory();try{
    const repo=new LabRepository(dir,'fingerprint',PLAN);
    await repo.change(account.uid,()=>({checkoutKey:'test-key',status:'CREATING'}));
    assert.equal(statSync(join(dir,'lab-account.json')).mode&0o777,0o600);
    assert.equal((await new LabRepository(dir,'fingerprint',PLAN).get(account.uid))?.status,'CREATING');
    assert.throws(()=>new LabRepository(dir,'other',PLAN));assert.throws(()=>new LabRepository(dir,'fingerprint','P-OTHERPLAN123456789'));
    await assert.rejects(repo.get('real-family'));await assert.rejects(repo.bind('other','',account.uid));
    const raw=readFileSync(join(dir,'lab-account.json'),'utf8');assert.ok(!raw.includes('fictional-secret'));
    writeFileSync(join(dir,'lab-account.json'),'broken');assert.throws(()=>new LabRepository(dir,'fingerprint',PLAN));
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('private lab uses actual billing service, verifies payment before access, resumes after restart, then cancels without erasing paid period',async()=>{
  const dir=directory();let server:ReturnType<typeof createServer>|undefined;
  try{
    let created=0,custom='',paid=false,status='APPROVAL_PENDING';
    const paypal={verify:async()=>false,request:async(path:string,method='GET',body?:Json)=>{
      if(path.startsWith('/v1/billing/plans/'))return plan;
      if(path==='/v1/billing/subscriptions'&&method==='POST'){created++;custom=body!.custom_id;return{id:SUB,links:[{rel:'approve',href:'https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=fictional'}]};}
      if(path.endsWith('/cancel')){status='CANCELLED';return{};}
      if(path.includes('/transactions?'))return{transactions:paid?[{id:'PAY-FICTIONAL',status:'COMPLETED',time:new Date(Date.now()-1000).toISOString(),amount_with_breakdown:{gross_amount:{value:'20.00',currency_code:'USD'}}}]:[]};
      return{id:SUB,plan_id:PLAN,custom_id:custom,status};
    }};
    const start=async()=>{
      const service=new BillingService(config,paypal,new LabRepository(dir,'fingerprint',PLAN));
      server=createServer(labHandler(service,ORIGIN,'fictional-csrf-token'));await new Promise<void>(r=>server!.listen(0,'127.0.0.1',r));
      return `http://127.0.0.1:${(server.address() as any).port}`;
    };
    let base=await start();
    const post=async(path:string,body:Json={},headers:Record<string,string>={})=>fetch(base+path,{method:'POST',headers:{Origin:ORIGIN,'X-Lab-Token':'fictional-csrf-token','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
    const page=await fetch(base+'/');assert.equal(page.status,200);assert.ok((await page.text()).includes('SOLO SANDBOX'));assert.equal(created,0);
    for(const headers of ([{'X-Lab-Token':'wrong'},{Origin:'https://evil.invalid'},{'Sec-Fetch-Site':'cross-site'}] as Record<string,string>[]))assert.equal((await post('/checkout',{consent:true},headers)).status,403);
    assert.equal((await post('/checkout',{})).status,400);assert.equal((await post('/commercial/paypal/webhook')).status,404);assert.equal(created,0);
    assert.equal((await (await post('/refresh')).json()).hasAccess,false);
    assert.equal((await post('/checkout',{consent:true})).status,200);assert.equal(created,1);
    assert.equal((await post('/checkout',{consent:true})).status,409);assert.equal(created,1);
    status='ACTIVE';assert.equal((await (await post('/refresh')).json()).hasAccess,false);
    paid=true;const confirmed=await (await post('/refresh')).json();assert.equal(confirmed.paid,true);assert.equal(confirmed.hasAccess,true);
    await new Promise<void>(r=>server!.close(()=>r()));base=await start();
    assert.equal((await post('/checkout',{consent:true})).status,409);assert.equal(created,1);
    assert.equal((await post('/cancel',{confirmation:'wrong'})).status,400);assert.equal(status,'ACTIVE');
    const cancelled=await (await post('/cancel',{confirmation:'CANCELAR PRUEBA'})).json();
    assert.equal(cancelled.status,'CANCELLED');assert.equal(cancelled.hasAccess,true);assert.equal(cancelled.paidThrough,confirmed.paidThrough);
    assert.equal((await post('/checkout',{consent:true})).status,409);assert.equal(created,1);
    assert.ok(!JSON.stringify(cancelled).includes('fictional-secret'));
  }finally{if(server?.listening)await new Promise<void>(r=>server!.close(()=>r()));rmSync(dir,{recursive:true,force:true});}
});
