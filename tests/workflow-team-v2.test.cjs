const {readFileSync}=require('node:fs');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const html=readFileSync('demos/workflow-team-v2.html','utf8');
function model(){const box={module:{exports:{}}};vm.runInNewContext(html.match(/<script id="simulation-model">([\s\S]*?)<\/script>/)[1],box);return new box.module.exports.Simulation();}
test('dual budget counts coordinator, independent QA/test slots and limits each writer',()=>{
 const s=model();assert.equal(s.used(),5);assert.equal(s.tasks[1].held.length,2);
 s.tasks.push({...s.tasks[0],id:'SIM-205',held:[],proof:{},human:{}});s.admit();assert.equal(s.used(),5);
 for(let i=0;i<500;i++){s.tick();assert.ok(s.used()<=s.cap&&s.used()<=s.batchCap);assert.ok(s.tasks.reduce((n,t)=>n+t.held.filter(x=>x==='dev').length,0)<=2);}
 const b=model();b.tasks.forEach(t=>t.held=[]);b.cap=3;b.admit();assert.ok(b.used()<=3);
 const c=model();c.tasks.forEach(t=>t.held=[]);c.batchCap=3;c.admit();assert.ok(c.used()<=3);
});
test('unknown retains exact occupancy; confirmed terminal keeps admission stopped',()=>{
 const s=model(),t=s.task(),before=s.used();assert.equal(s.lose(),true);for(let i=0;i<20;i++)s.tick();assert.equal(t.unknown,true);assert.equal(t.held.length,1);assert.equal(s.reconcile(),true);assert.equal(t.held.length,0);assert.equal(s.stopped,true);assert.ok(before>=s.used());s.stop();assert.equal(s.stopped,false);assert.equal(t.held.length,1);
});
test('human acceptance is never automatic and close requires matching deployment/quality proof',()=>{
 const s=model();s.selected='SIM-203';const t=s.task();for(let i=0;i<100;i++)s.tick();assert.equal(t.stage,6);assert.equal(t.done,false);assert.equal(s.approve(),true);for(let i=0;i<17;i++)s.tick();assert.equal(t.done,true);
 const b=model(),x=b.tasks[2];x.human[6]=1;delete x.proof.deploy;assert.equal(b.next(x),false);x.proof.deploy=b.binding(x);x.proof.qa='stale';assert.equal(b.next(x),false);
});
test('quality return changes head and invalidates all later evidence and approval',()=>{
 const s=model();s.selected='SIM-203';const t=s.task();assert.equal(s.reject(),true);assert.equal(t.stage,2);assert.equal(t.revision,2);assert.equal(Object.keys(t.proof).length,0);assert.equal(Object.keys(t.human).length,0);assert.equal(s.quality(t),false);
});
test('stop drains existing work while preventing new admissions; resume is explicit',()=>{
 const s=model();s.stop();for(let i=0;i<30;i++)s.tick();assert.equal(s.used(),1);assert.equal(s.stopped,true);s.stop();assert.ok(s.used()>1);
});
test('disconnect freezes time, histories and controls; reset is deterministic',()=>{
 const s=model();s.connected=false;const before=JSON.stringify(s);s.tick(true);s.stop();s.approve();s.reject();s.lose();s.reconcile();assert.equal(JSON.stringify(s),before);s.reset();assert.equal(JSON.stringify(s),JSON.stringify(model()));
});
test('page is offline, labels simulation and supports reduced motion and numerical text contrast',()=>{
 assert.ok(!/src=["']https?:|fetch\(|new WebSocket|@import|fonts.googleapis/.test(html));assert.ok(html.includes('prefers-reduced-motion'));assert.ok(html.includes('数据已过期'));assert.ok(html.includes('双开发者为 V2 候选'));
 function luminance(h){const a=h.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];}
 for(const bg of ['101925','20364b','2b281f','292319','1b2c3e'])for(const fg of ['edf4fc','a5b5c9','75d5ff','f7cf79','ffa6b0','94e1ba'])assert.ok((luminance(fg)+.05)/(luminance(bg)+.05)>=4.5,`${fg}/${bg}`);
});
