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
  vm.runInContext(script.split('/* ═══ 启动 ═══ */')[0] + '\nthis.api={STAGES,PHASES,DOD,ROLES,TASKS,makeTask,recordEvidence,gateReady,advanceTask,returnToDev,failRelease,changeRevision,startWork,stopWork,activeCount,demoCopy,DEMO_POLICY,CODE_CHILD};', context);
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
test('fixed policy4 boundary includes coordinator, three single workers, and per-agent/single-dev limits',()=>{
  const m=model();for(const t of m.TASKS)m.stopWork(t);
  assert.equal(m.DEMO_POLICY.maxParallel,4);assert.equal(m.DEMO_POLICY.policyVersion,'2026-10-27.1');
  for(const i of [0,2,5])assert.equal(m.startWork(m.TASKS[i]),true);
  assert.equal(m.activeCount(),4);assert.equal(m.startWork(m.TASKS[6]),false);
  m.stopWork(m.TASKS[0]);assert.equal(m.startWork(m.TASKS[6]),true);assert.equal(m.activeCount(),4);
  for(const t of m.TASKS)m.stopWork(t);
  assert.equal(m.startWork(m.TASKS[2]),true);
  const other=m.makeTask(2);other.id="SIM-SECOND-DEV";m.TASKS.push(other);assert.equal(m.startWork(other),false);
  assert.equal(m.startWork(m.TASKS[1]),false); // active coordinator already owns master-brain
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
  // Focus/identity DOM doubles only: no layout, browser engine or native event dispatch.
  const nodes=new Map(), timers=[], listeners=new Map();
  let document;
  function element(attrs={}) {
    const classes=new Set((attrs.class||'').split(/\s+/).filter(Boolean));
    let markup='';
    const el={id:attrs.id||'',textContent:'',value:'',children:[],style:{},dataset:{},attributes:{...attrs},inert:false,hidden:false,disabled:false,isConnected:true,parentElement:null,
      classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),
        toggle(k,force){const on=force===undefined?!classes.has(k):force;if(on)classes.add(k);else classes.delete(k);}},
      setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k]??null;},
      focus(){document.activeElement=this;},
      contains(target){for(let n=target;n;n=n.parentElement)if(n===this)return true;return false;},
      closest(){for(let n=this;n;n=n.parentElement)if(n.hidden||n.inert)return n;return null;},
      querySelectorAll(){return this.controls?.filter(c=>!c.disabled)||[];},
      querySelector(selector){return selector==='.cid'?{textContent:this.cidText}:this.querySelectorAll(selector)[0]||null;},
      matches(selector){return selector==='[role="button"]'&&this.attributes.role==='button';},dispatchEvent(event){this.lastEvent=event;return true;},addEventListener(){},select(){},remove(){},
      prepend(child){this.children.unshift(child);child.remove=()=>this.children.splice(this.children.indexOf(child),1);},
      appendChild(child){this.children.push(child);},get lastChild(){return this.children.at(-1);}
    };
    Object.defineProperty(el,'innerHTML',{get:()=>markup,set(value){
      markup=value;
      if(el===nodes.get('#sheet')) {
        for(const old of el.controls||[])old.isConnected=false;
        if(el.contains(document.activeElement))document.activeElement=document.body;
        el.controls=[];
        // Model only the focus targets needed by the actual drawer functions.
        for(const match of value.matchAll(/<(button|select|input|textarea|summary|span|div|g)\b([^>]*)>/g)) {
          const [,tag,source]=match;
          const attrs=Object.fromEntries(Array.from(source.matchAll(/([\w-]+)="([^"]*)"/g),m=>[m[1],m[2]]));
          if(!['button','select','input','textarea','summary'].includes(tag)&&!attrs.onclick)continue;
          const control=element(attrs);control.parentElement=el;control.disabled=/\bdisabled(?:\s|$)/.test(source);
          el.controls.push(control);if(attrs.id)nodes.set('#'+attrs.id,control);
        }
      }
      if(el===nodes.get('#lanes')) {
        el.chips=Array.from(value.matchAll(/<div class="chip ([^"]*)"([^>]*)>/g),(m,i)=>{
          const chip=element({class:'chip '+m[1]});
          chip.dataset.taskId=/data-task-id="([^"]+)"/.exec(m[2])?.[1];
          chip.cidText='SIM-0'+(i+1)+'⏳';
          return chip;
        });
      }
    }});
    return el;
  }
  function getNode(s){if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);}
  document={querySelector:getNode,querySelectorAll:s=>s==='.chip'?getNode('#lanes').chips||[]:[],
    getElementById:id=>getNode('#'+id),createElement:()=>element(),
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    body:element(),execCommand:()=>false};
  document.activeElement=document.body;
  const context={document,MouseEvent:class {constructor(type,options){this.type=type;Object.assign(this,options);}},MutationObserver:class {observe(){}},requestAnimationFrame:fn=>fn(),setInterval:fn=>timers.push(fn),setTimeout:()=>1,clearTimeout(){},navigator:{}};
  context.window=context; vm.createContext(context); vm.runInContext(script,context);
  return {context,nodes,timers,element,snapshot:()=>vm.runInContext('JSON.stringify(TASKS)',context),
    key(key,shiftKey=false){const e={key,shiftKey,target:document.activeElement,prevented:false,preventDefault(){this.prevented=true;}};for(const fn of listeners.get('keydown')||[])fn(e);return e;}};
}
test('actual script startup and all retained drawer renderers execute without undefined state',()=>{
  const {context:c,nodes}=renderHarness();
  assert.match(nodes.get('#budget').textContent,/2\/4/);
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

test('QA-01: role selection dims seven non-PD chips, toggles off, and preserves matching dev',()=>{
  const {context:c,nodes}=renderHarness();
  const chips=()=>nodes.get('#lanes').chips;
  assert.ok(chips().every(chip=>chip.dataset.taskId));
  c.toggleRole('pd');
  assert.equal(chips().filter(chip=>chip.classList.contains('dim')).length,7);
  assert.equal(chips()[0].classList.contains('dim'),false);
  c.toggleRole('pd');assert.equal(chips().filter(chip=>chip.classList.contains('dim')).length,0);
  c.toggleRole('dev');assert.equal(chips()[2].classList.contains('dim'),false);
  assert.equal(chips().filter(chip=>chip.classList.contains('dim')).length,7);
});
test('QA-02: drawer initial focus, Tab boundaries, background inert and Escape restore opener',()=>{
  const {context:c,nodes,element,key}=renderHarness(),doc=c.document;
  const opener=element();opener.focus();
  c.openDrawer('SIM-03');
  const sheet=nodes.get('#sheet'),controls=sheet.querySelectorAll();
  assert.ok(sheet.contains(doc.activeElement));assert.equal(nodes.get('#app').inert,true);
  controls[0].focus();assert.equal(key('Tab',true).prevented,true);
  assert.equal(doc.activeElement,controls.at(-1));
  assert.equal(key('Tab').prevented,true);assert.equal(doc.activeElement,controls[0]);
  key('Escape');assert.equal(nodes.get('#app').inert,false);assert.equal(doc.activeElement,opener);
});
test('QA-02: refresh retains action focus; nested drawers keep original opener; fallback and backdrop close',()=>{
  const {context:c,nodes,element}=renderHarness(),doc=c.document;
  const opener=element();opener.focus();c.openDrawer('SIM-03');
  const sheet=nodes.get('#sheet');
  const action=sheet.controls.find(el=>el.getAttribute('onclick')==="simulate('SIM-03','proof','implementation')");
  action.focus();c.simulate('SIM-03','proof','implementation');
  assert.notEqual(doc.activeElement,action);assert.equal(action.isConnected,false);
  assert.equal(doc.activeElement.getAttribute('onclick'),action.getAttribute('onclick'));
  c.openRole('dev',0);assert.ok(sheet.contains(doc.activeElement));
  c.openGraph();assert.ok(sheet.contains(doc.activeElement));
  // Execute the real backdrop handler with mocked targets, without a browser.
  const handler=html.match(/id="drawer" onclick="([^"]+)"/)[1];
  c.mockBackdrop=nodes.get('#drawer');c.mockTarget=sheet;
  vm.runInContext(`(function(event){${handler}}).call(mockBackdrop,{target:mockTarget})`,c);
  assert.equal(nodes.get('#drawer').classList.contains('open'),true);
  c.mockTarget=nodes.get('#drawer');
  vm.runInContext(`(function(event){${handler}}).call(mockBackdrop,{target:mockTarget})`,c);
  assert.equal(nodes.get('#drawer').classList.contains('open'),false);
  assert.equal(doc.activeElement,opener);
  const fallback=element();nodes.get('#app').controls=[fallback];
  opener.focus();c.openDrawer('SIM-03');opener.isConnected=false;c.closeDrawer();
  assert.equal(doc.activeElement,fallback);
});
test('policy4 projected dual-role admission and stop are explicit',()=>{
 const m=model(),pd=m.TASKS[0],dev=m.TASKS[2],quality=m.TASKS[3];
 assert.equal(m.startWork(quality),true);assert.equal(m.activeCount(),4);
 assert.equal(m.startWork(pd),false);m.stopWork(quality);
 assert.equal(m.startWork(pd),true);assert.equal(m.activeCount(),3);
 assert.equal(m.startWork(quality),false);m.stopWork(dev);
 assert.equal(m.startWork(quality),true);assert.equal(m.activeCount(),4);
});
test('concurrency risk: both independent roles render active for one parallel quality task',()=>{
  const {context:c,nodes}=renderHarness();
  c.simulate('SIM-03','work');c.simulate('SIM-04','work');
  assert.match(nodes.get('#budget').textContent,/3\/4/);
  const cards=nodes.get('#roles').innerHTML;
  for(const k of ['qareview','te']) {
    const card=cards.split('<div class="role ').find(part=>part.split('>')[0].includes(`onclick="toggleRole('${k}')"`));
    assert.match(card.split('>')[0],/\bon\b/);
  }
  c.openRole('te',0);assert.match(nodes.get('#sheet').innerHTML,/模拟占槽/);
  assert.match(nodes.get('#sheet').innerHTML,/SIM-04/);
  c.openGraph();assert.match(nodes.get('#sheet').innerHTML,/cy="294" r="32"/);
  c.openKpi('doing');nodes.get('#frole').value='te';c.renderKpiList();
  assert.match(nodes.get('#fti').textContent,/1\/8/);
  c.toggleRole('te');assert.equal(nodes.get('#lanes').chips.filter(chip=>chip.classList.contains('dim')).length,7);
});

test('QA-02: refreshed disabled target falls back; Tab from outside and no-control content stay inside',()=>{
  const {context:c,nodes,element,key}=renderHarness(),doc=c.document;
  c.openDrawer('SIM-03');
  const sheet=nodes.get('#sheet');
  c.setDrawerContent('<button onclick="testAction()">one</button><button disabled>disabled</button>');
  assert.equal(sheet.querySelectorAll().length,1);
  sheet.controls[0].focus();
  c.setDrawerContent('<button disabled onclick="testAction()">one</button><button onclick="otherAction()">two</button>');
  assert.equal(doc.activeElement.getAttribute('onclick'),'otherAction()');
  const outside=element();outside.focus();assert.equal(key('Tab').prevented,true);
  assert.equal(doc.activeElement,sheet.controls[1]);
  c.setDrawerContent('<p>No actions</p>');assert.equal(doc.activeElement,sheet);
  assert.equal(key('Tab').prevented,true);assert.equal(doc.activeElement,sheet);
  assert.equal(key('Tab',true).prevented,true);assert.equal(doc.activeElement,sheet);
  c.closeDrawer();
});

test('code child completion cannot satisfy parent written acceptance',()=>{const m=model();assert.equal(m.CODE_CHILD.status,'completed');assert.equal(m.CODE_CHILD.parentStatus,'pending_owner');const t=m.makeTask(6);assert.equal(m.advanceTask(t),false);});

test('native-keyboard click dispatch supports non-HTMLElement SVG role controls',()=>{const h=renderHarness(),control=h.element({role:'button'});control.focus();for(const key of ['Enter',' ']){assert.equal(h.key(key).prevented,true);assert.equal(control.lastEvent.type,'click');assert.equal(control.lastEvent.bubbles,true);}});
