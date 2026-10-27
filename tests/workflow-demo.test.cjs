const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const html = readFileSync('demos/workflow-demo.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function model() {
  // Execute the actual inline script, with rendering startup excluded; no browser/layout claim.
  const context = { window: {}, document: { addEventListener() {}, getElementById() {} }, MutationObserver:class {observe(){}}, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(script.split('/* ═══ 启动 ═══ */')[0] + '\nthis.api={STAGES,PHASES,DOD,ROLES,TASKS,makeTask,recordEvidence,gateReady,advanceTask,returnToDev,failRelease,changeRevision,startWork,stopWork,activeCount,demoCopy};', context);
  return context.api;
}
test('exact eight-stage contract and complete phase details', () => {
  const m = model();
  assert.deepEqual(Array.from(m.STAGES), ['需求','计划','开发','测试／审查','合并','发布','验收','关单']);
  for (const p of m.PHASES) for (const field of ['role','input','output','human','gate','failure']) assert.ok(p[field]);
  assert.equal(m.DOD.length, 7);
  assert.deepEqual(Object.values(m.ROLES).filter(r=>r.core).map(r=>r.en).sort(), ['dev','master-brain','pd','qa-review','test-engineer']);
});
test('each stage blocks without its evidence; explicit simulated acceptance precedes close', () => {
  const m = model(), t = m.makeTask(0);
  for (let stage=0; stage<8; stage++) {
    assert.equal(t.st, stage);
    assert.equal(m.advanceTask(t), false);
    for (const g of m.PHASES[stage].checks) {
      assert.equal(m.gateReady(t), false);
      assert.equal(m.recordEvidence(t,g.key), true);
    }
    assert.equal(m.gateReady(t), true);
    assert.equal(m.advanceTask(t), true);
    if (stage<7) assert.equal(t.done, false);
  }
  assert.equal(t.done, true);
  assert.equal(m.advanceTask(t), false);
});
test('quality is independently bound to identical head/base and P0/P1 blocks', () => {
  const m=model(), t=m.makeTask(3);
  for (const g of m.PHASES[3].checks) m.recordEvidence(t,g.key);
  assert.notEqual(t.evidence.review.actor,t.evidence.test.actor);
  assert.equal(m.gateReady(t),true);
  t.blockers=1; assert.equal(m.gateReady(t),false); t.blockers=0;
  t.evidence.review.head='SIM-STALE'; assert.equal(m.gateReady(t),false);
  m.recordEvidence(t,'review'); t.evidence.test.base='SIM-STALE'; assert.equal(m.gateReady(t),false);
});
test('changed revision invalidates downstream proof and returns to original dev', () => {
  const m=model(), t=m.makeTask(6);
  m.recordEvidence(t,'acceptance');
  m.changeRevision(t);
  assert.equal(t.st,2); assert.equal(t.ow,'dev'); assert.equal(t.done,false);
  assert.equal(t.evidence.review,undefined); assert.equal(t.evidence.acceptance,undefined);
  assert.equal(m.advanceTask(t),false);
  t.st=3; m.returnToDev(t);
  assert.equal(t.st,2); assert.equal(t.ow,t.originalDev);
});
test('release failure stays release, clears release proof and blocks acceptance', () => {
  const m=model(), t=m.makeTask(5);
  for (const g of m.PHASES[5].checks) m.recordEvidence(t,g.key);
  m.failRelease(t);
  assert.equal(t.st,5); assert.equal(t.releaseFailed,true); assert.equal(m.advanceTask(t),false);
  for (const g of m.PHASES[5].checks) m.recordEvidence(t,g.key);
  assert.equal(m.advanceTask(t),true); assert.equal(t.st,6);
  assert.equal(m.advanceTask(t),false);
});
test('global simulated budget includes coordinator; queues and stopped work free slots only explicitly', () => {
  const m=model();
  for (const t of m.TASKS) m.stopWork(t);
  assert.equal(m.activeCount(),1);
  assert.equal(m.startWork(m.TASKS[0]),true); assert.equal(m.startWork(m.TASKS[1]),true);
  assert.equal(m.activeCount(),3); assert.equal(m.startWork(m.TASKS[2]),false);
  m.stopWork(m.TASKS[0]); assert.equal(m.startWork(m.TASKS[2]),true);
  assert.equal(m.activeCount(),3);
});
test('copy is non executable; no random progression, live platform claims or network calls', () => {
  const m=model();
  assert.match(m.demoCopy(m.TASKS[0],'urge'), /不可执行/);
  assert.doesNotMatch(m.demoCopy(m.TASKS[0],'urge'), /@|curl|\/goal/);
  assert.doesNotMatch(script,/Math\.random|fetch\(|XMLHttpRequest|粘贴到群里|实时 \+|sch_[0-9a-f]|#199[023]/);
  const startup=script.split('/* ═══ 启动 ═══ */')[1];
  assert.doesNotMatch(startup,/advanceTask|\.st\+\+|\.done\s*=/);
  assert.match(html, /@media\s*\(max-width:\s*700px\)/);
  assert.match(html, /模拟全局预算/);
});

function renderHarness() {
  const nodes=new Map(), timers=[];
  function element() {
    const classes=new Set();
    return { innerHTML:'',textContent:'',value:'',children:[],style:{},dataset:{},
      classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(){}},
      querySelectorAll:()=>[],addEventListener(){},select(){},remove(){},
      prepend(el){this.children.unshift(el);el.remove=()=>this.children.splice(this.children.indexOf(el),1);},appendChild(el){this.children.push(el);},get lastChild(){return this.children.at(-1);}
    };
  }
  const context={document:{querySelector:s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);},querySelectorAll:()=>[],getElementById:()=>element(),createElement:element,addEventListener(){},body:element(),execCommand:()=>false},
    MutationObserver:class {observe(){}},requestAnimationFrame:fn=>fn(),setInterval:fn=>timers.push(fn),setTimeout:()=>1,clearTimeout(){},navigator:{}};
  context.window=context; vm.createContext(context); vm.runInContext(script,context);
  return {context,nodes,timers,snapshot:()=>vm.runInContext('JSON.stringify(TASKS)',context)};
}
test('actual script startup and all retained drawer renderers execute without undefined state',()=>{
  const {context:c,nodes}=renderHarness();
  assert.match(nodes.get('#budget').textContent,/2\/3/);
  assert.equal((nodes.get('#lanes').innerHTML.match(/phase-btn/g)||[]).length,8);
  for(const role of ['admin5','zwen','pd','dev','qareview','te','support']) {
    c.openRole(role,0);
    assert.doesNotMatch(nodes.get('#sheet').innerHTML,/undefined/);
    assert.ok(nodes.get('#drawer').classList.contains('open'));
  }
  for(let i=0;i<8;i++) {
    c.openPhase(i); assert.match(nodes.get('#sheet').innerHTML,/七项DoD/);
    c.openDrawer('SIM-0'+(i+1)); assert.match(nodes.get('#sheet').innerHTML,/模拟证据门/);
  }
  c.openGraph(); assert.match(nodes.get('#sheet').innerHTML,/data-k="dev"/);
  c.openEnt('ledger','id16'); assert.match(nodes.get('#sheet').innerHTML,/head_sha/);
  c.openKpi('doing'); assert.match(nodes.get('#fti').textContent,/8\/8/);
  nodes.get('#fstage').value='2'; c.renderKpiList(); assert.match(nodes.get('#fti').textContent,/1\/8/);
  nodes.get('#frole').value='pd'; c.renderKpiList(); assert.match(nodes.get('#fti').textContent,/0\/8/);
  nodes.get('#frole').value='dev'; nodes.get('#fq').value='no such task'; c.renderKpiList(); assert.match(nodes.get('#frows').innerHTML,/无匹配/);
  c.closeDrawer(); assert.equal(nodes.get('#drawer').classList.contains('open'),false);
});
test('event timer/pause never modifies stages, evidence, acceptance or active budget',()=>{
  const {context:c,nodes,timers,snapshot}=renderHarness(), before=snapshot();
  const initial=nodes.get('#feed').children.length;
  c.togglePause(); timers.forEach(fn=>fn()); assert.equal(nodes.get('#feed').children.length,initial);
  c.togglePause(); timers.forEach(fn=>fn()); assert.equal(nodes.get('#feed').children.length,initial+1);
  for(let i=0;i<100;i++) timers.forEach(fn=>fn());
  assert.equal(snapshot(),before);
});
test('UI evidence controls keep acceptance manual and show revision invalidation',()=>{
  const {context:c,nodes}=renderHarness();
  c.simulate('SIM-07','advance'); assert.match(nodes.get('#sheet').innerHTML,/缺证据，阻止推进/);
  c.simulate('SIM-07','proof','acceptance'); c.simulate('SIM-07','advance');
  assert.match(nodes.get('#sheet').innerHTML,/状态 <b>关单/); assert.match(nodes.get('#sheet').innerHTML,/缺证据，阻止推进/);
  c.simulate('SIM-04','defect'); c.simulate('SIM-04','revision');
  assert.match(nodes.get('#sheet').innerHTML,/SIM-HEAD-A-NEXT/);
  assert.match(nodes.get('#sheet').innerHTML,/范围与AC批准/);
});

test('later gates reject stale upstream evidence and wrong quality/release signatories',()=>{
  const m=model(), merge=m.makeTask(4), release=m.makeTask(5), close=m.makeTask(7);
  m.recordEvidence(merge,'merge');
  merge.evidence.review.actor='dev'; assert.equal(m.advanceTask(merge),false);
  release.base='SIM-NEW-BASE';
  for(const g of m.PHASES[5].checks) m.recordEvidence(release,g.key);
  assert.equal(m.advanceTask(release),false);
  const clean=m.makeTask(5);
  for(const g of m.PHASES[5].checks) m.recordEvidence(clean,g.key);
  clean.evidence.deploymentTest.actor='authorized-executor'; assert.equal(m.advanceTask(clean),false);
  for(const g of m.PHASES[7].checks) m.recordEvidence(close,g.key);
  delete close.evidence.acceptance; assert.equal(m.advanceTask(close),false);
});
