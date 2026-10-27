const {test,expect}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const faults=new WeakMap();
async function verifyHTML(response){
 expect(response.status()).toBe(200);
 const expected=JSON.parse(fs.readFileSync(path.join(process.env.MAP_ARTIFACT_DIR,'manifest.json'))).sourceHTMLSHA256;
 expect(crypto.createHash('sha256').update(await response.body()).digest('hex'),'loaded browser HTML matches expected tree').toBe(expected);
}
async function act(locator,info){
 await locator.scrollIntoViewIfNeeded();await expect(locator).toBeVisible();
 const reachable=await locator.evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.width>0&&r.height>0&&(hit===el||el.contains(hit));});
 expect(reachable,'control center is reachable and unobscured').toBe(true);
 await test.step('native '+(info.project.use.hasTouch?'tap':'click')+' '+(await locator.getAttribute('onclick')||await locator.textContent()),async()=>{if(info.project.use.hasTouch)await locator.tap();else await locator.click();});
}
const task=(page,id)=>page.locator(`[data-task-id="${id}"]`);
const action=(page,name)=>page.locator('#sheet').getByRole('button',{name,exact:false});
async function openTask(page,id,info){await act(task(page,id),info);await expect(page.locator('#sheet')).toContainText(id);}
async function close(page){await page.keyboard.press('Escape');await expect(page.locator('#drawer')).not.toHaveClass(/open/);}
async function fill(page,info){const pending=page.locator('#sheet .proofs button').filter({hasText:'待补'});while(await pending.count())await act(pending.first(),info);}
async function advance(page,info){await act(action(page,'模拟通过当前门'),info);}
async function snapshot(page){return page.evaluate(()=>JSON.stringify(TASKS));}
async function layout(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no document horizontal overflow').toBe(true);}
test.beforeEach(async({page,context,baseURL})=>{
 const errors=[];faults.set(page,errors);
 page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text());});page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 await page.addInitScript(()=>{window.__rejections=[];addEventListener('unhandledrejection',e=>window.__rejections.push(String(e.reason)));});
 await context.route('**/*',route=>{const req=route.request();if(req.method()!=='GET'||new URL(req.url()).origin!==new URL(baseURL).origin){errors.push('forbidden request: '+req.method()+' '+req.url());return route.abort();}return route.continue();});
 await verifyHTML(await page.goto(baseURL));
 await expect(page.locator('.phase-btn')).toHaveCount(8);
});
test.afterEach(async({page,browser},info)=>{
 await info.attach('environment',{body:JSON.stringify({viewport:page.viewportSize(),touch:info.project.use.hasTouch,mobile:info.project.use.isMobile,browser:browser.version(),node:process.version,project:info.project.name}),contentType:'application/json'});
 await info.attach('case-screenshot',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 expect(faults.get(page),'no unexpected console/page/network errors').toEqual([]);
 expect(await page.evaluate(()=>window.__rejections),'no unhandled rejections').toEqual([]);
 await layout(page);
});
test('A load layout and reachable panels',async({page},info)=>{
 await expect(page.locator('h1')).toContainText('v1.4');await expect(page.locator('.badge')).toContainText('纯模拟');
 await expect(page.locator('#budget')).toContainText('/4');await expect(page.locator('#budget')).toContainText('2026-10-27.1');
 await expect(page.locator('.role')).toHaveCount(7);await expect(page.locator('.chip')).toHaveCount(8);
 for(const id of ['SIM-01','SIM-08']){await openTask(page,id,info);await expect(page.locator('#sheet')).toContainText('进入输入');await close(page);}
 await page.locator('#feed .ev').last().scrollIntoViewIfNeeded();await layout(page);
});
test('B all phases six fields packages handoff DoD and close routes',async({page},info)=>{
 for(let i=0;i<8;i++){
  await act(page.locator('.phase-btn').nth(i),info);
  for(const text of ['责任角色','进入输入','输出/证据','人工决策','退出门','失败回流','任务包','交接','七项DoD','N/A须理由'])await expect(page.locator('#sheet')).toContainText(text);
  if(i%3===0){await act(page.locator('#sheet .x'),info);}
  else if(i%3===1){await page.locator('#drawer').click({position:{x:2,y:2}});}
  else await close(page);
  await expect(page.locator('#drawer')).not.toHaveClass(/open/);
 }
});
test('C all roles tasks highlight and retained selection after refresh',async({page},info)=>{
 for(const key of ['admin5','zwen','pd','dev','qareview','te','support']){
  const role=page.locator(`.role[onclick="toggleRole('${key}')"]`);
  await act(role,info);await expect(role).toHaveClass(/sel/);
  const count=await page.evaluate(k=>TASKS.filter(t=>!taskRoles(t).includes(k)&&!t.done).length,key);
  await expect(page.locator('.chip.dim')).toHaveCount(count);
  await act(role.locator('.rdetail'),info);await expect(page.locator('#sheet')).toContainText(key==='support'?'按需支持':key==='zwen'?'master-brain':key==='te'?'test-engineer':key==='qareview'?'qa-review':key);await close(page);
  await act(role,info);await expect(page.locator('.chip.dim')).toHaveCount(0);
 }
 for(let i=1;i<=8;i++){await openTask(page,'SIM-0'+i,info);await expect(page.locator('#sheet')).toContainText('SIM-HEAD-A');await expect(page.locator('#sheet')).toContainText('模拟执行角色');await close(page);}
 await act(page.locator('.role[onclick="toggleRole(\'pd\')"]'),info);await openTask(page,'SIM-01',info);await fill(page,info);await advance(page,info);await close(page);
 await expect(page.locator('.role.sel')).toContainText('pd');await expect(page.locator('.chip.dim')).toHaveCount(8);
});
test('D all KPI filters counts graph nodes hover keyboard and touch',async({page},info)=>{
 for(const kind of ['doing','wait','created','closed']){
  await act(page.locator(`.kpi[onclick="openKpi('${kind}')"]`),info);
  const expected=await page.evaluate(k=>KPI_SETS[k].get().length,kind);await expect(page.locator('#fcnt')).toHaveText(`筛选 ${expected} / 共 ${expected}`);
  for(const st of ['','0','1','2','3','4','5','6','7']){await page.locator('#fstage').selectOption(st);for(const ow of ['','admin5','zwen','pd','dev','qareview','te','support']){
   await page.locator('#frole').selectOption(ow);
   const n=await page.evaluate(({kind,st,ow})=>KPI_SETS[kind].get().filter(t=>(st===''||t.st===+st)&&(!ow||taskRoles(t).includes(ow))).length,{kind,st,ow});await expect(page.locator('#fcnt')).toHaveText(`筛选 ${n} / 共 ${expected}`);
  }}
  await page.locator('#fq').fill('NO_MATCH');await expect(page.locator('#frows')).toContainText('无匹配');
  await page.locator('#fq').fill('');await page.locator('#fstage').selectOption('');await page.locator('#frole').selectOption('');
  if(expected){await act(page.locator('#frows .row').first(),info);await act(page.locator('#sheet .backlnk'),info);await expect(page.locator('#fcnt')).toContainText('共 '+expected);}
  await close(page);
 }
 for(const k of ['admin5','zwen','pd','dev','qareview','te','support','ledger']){
  await act(page.locator('.lnk'),info);const node=page.locator(`.gn[data-k="${k}"]`);
  if(!info.project.use.hasTouch){await node.hover();await expect(page.locator('#gsvg')).toHaveClass(/hasfocus/);await node.focus();await page.keyboard.press('Enter');}
  else await act(node,info);
  await expect(page.locator('#sheet')).toContainText(k==='ledger'?'模拟任务包':k==='support'?'按需支持':k==='zwen'?'master-brain':k==='te'?'test-engineer':k==='qareview'?'qa-review':k);await close(page);
 }
});
test('E events pause resume bounded feed and zero gate mutation',async({page},info)=>{
 await page.clock.install();await verifyHTML(await page.reload());const before=await snapshot(page);
 await act(page.locator('#pause'),info);const count=await page.locator('#evtoday').textContent();await page.clock.runFor(10001);await expect(page.locator('#evtoday')).toHaveText(count);
 await act(page.locator('#pause'),info);await page.clock.runFor(5001);expect(await page.locator('#evtoday').textContent()).not.toBe(count);
 await page.clock.runFor(250001);await expect(page.locator('#feed .ev')).toHaveCount(40);expect(await snapshot(page)).toBe(before);
});
test('F UI eight-gate journey quality failure new-head proof rebinding and recovery',async({page},info)=>{
 const id='SIM-01';await openTask(page,id,info);
 for(let stage=0;stage<8;stage++){
  await expect(action(page,'模拟通过当前门')).toBeDisabled();
  if(stage===3){
   await act(action(page,'模拟质量失败'),info);expect(await page.evaluate(id=>TASKS.find(t=>t.id===id).ow,id)).toBe('dev');
   await act(action(page,'模拟新head'),info);await expect(page.locator('#sheet')).toContainText('SIM-HEAD-A-NEXT');
   await fill(page,info);await advance(page,info);await expect(action(page,'模拟通过当前门')).toBeDisabled();
   await page.evaluate(id=>{TASKS.find(t=>t.id===id).blockers=1;},id);await close(page);await openTask(page,id,info);await fill(page,info);await expect(action(page,'模拟通过当前门')).toBeDisabled();
   await page.evaluate(id=>{TASKS.find(t=>t.id===id).blockers=0;},id);await close(page);await openTask(page,id,info);
   await page.evaluate(id=>{TASKS.find(t=>t.id===id).evidence.review.base='SIM-STALE';},id);await close(page);await openTask(page,id,info);await expect(action(page,'模拟通过当前门')).toBeDisabled();
  }
  await fill(page,info);await expect(action(page,'模拟通过当前门')).toBeEnabled();
  if(stage===3){const records=await page.evaluate(id=>TASKS.find(t=>t.id===id).evidence,id);expect(records.review.actor).not.toBe(records.test.actor);expect(records.review.head).toBe(records.test.head);expect(records.review.base).toBe(records.test.base);}
  await advance(page,info);
 }
 expect(await page.evaluate(id=>TASKS.find(t=>t.id===id).done,id)).toBe(true);
});
test('G release repair human acceptance DoD and completed code child parent hold',async({page},info)=>{
 await openTask(page,'SIM-06',info);await fill(page,info);await act(action(page,'模拟发布失败'),info);await expect(page.locator('#sheet')).toContainText('仍在发布修复/回退');await expect(action(page,'模拟通过当前门')).toBeDisabled();
 await fill(page,info);const records=await page.evaluate(()=>TASKS[5].evidence);expect(records.deploy.actor).not.toBe(records.deploymentTest.actor);
 await advance(page,info);await expect(page.locator('#code-child')).toContainText('completed');await expect(page.locator('#code-child')).toContainText('pending_owner');await expect(action(page,'模拟通过当前门')).toBeDisabled();
 await fill(page,info);await advance(page,info);await expect(action(page,'模拟通过当前门')).toBeDisabled();
 const proofs=page.locator('.proofs button');await expect(proofs).toHaveCount(7);for(const button of await proofs.all()){await expect(action(page,'模拟通过当前门')).toBeDisabled();await act(button,info);}
 await advance(page,info);expect(await page.evaluate(()=>TASKS[5].done)).toBe(true);
});
test('H policy4 projected budget per-agent and dual quality role displays',async({page},info)=>{
 const work=async id=>{await openTask(page,id,info);await act(action(page,'模拟申请占槽'),info);await close(page);};
 const stop=async id=>{await openTask(page,id,info);await act(action(page,'模拟确认停止'),info);await close(page);};
 await work('SIM-04');await expect(page.locator('#budget')).toContainText('4/4');await work('SIM-01');expect(await page.evaluate(()=>TASKS[0].active)).toBe(false);
 for(const k of ['qareview','te']){await expect(page.locator(`.role[onclick="toggleRole('${k}')"]`)).toHaveClass(/on/);}
 await stop('SIM-04');await work('SIM-01');await expect(page.locator('#budget')).toContainText('3/4');await work('SIM-04');expect(await page.evaluate(()=>TASKS[3].active)).toBe(false);
 await stop('SIM-03');await work('SIM-04');await expect(page.locator('#budget')).toContainText('4/4');await stop('SIM-04');await work('SIM-03');await work('SIM-06');await expect(page.locator('#budget')).toContainText('4/4');await work('SIM-07');expect(await page.evaluate(()=>TASKS[6].active)).toBe(false);
 await stop('SIM-06');await page.evaluate(()=>{TASKS[5].ow='dev';});await work('SIM-06');expect(await page.evaluate(()=>TASKS[5].active)).toBe(false);
});
test('I native keyboard focus refresh nested dead-opener and clipboard fallback',async({page,context,baseURL},info)=>{
 const opener=task(page,'SIM-03');await opener.scrollIntoViewIfNeeded();const openerHandle=await opener.elementHandle();await opener.focus();await page.keyboard.press('Enter');
 expect(await page.evaluate(()=>document.querySelector('#sheet').contains(document.activeElement))).toBe(true);expect(await page.locator('#app').evaluate(el=>el.inert)).toBe(true);
 const first=page.locator('#sheet .x');await first.focus();await page.keyboard.press('Shift+Tab');expect(await page.evaluate(()=>document.activeElement===drawerControls().at(-1))).toBe(true);await page.keyboard.press('Tab');await expect(first).toBeFocused();
 await act(action(page,'模拟 · 实现与AC映射'),info);await expect(action(page,'模拟 · 实现与AC映射')).toBeFocused();expect(await openerHandle.evaluate(el=>el.isConnected)).toBe(false);await fill(page,info);await advance(page,info);expect(await page.evaluate(()=>document.querySelector('#sheet').contains(document.activeElement)&&!document.activeElement.disabled)).toBe(true);await close(page);expect(await page.evaluate(()=>document.activeElement.isConnected&&!document.querySelector('#app').inert)).toBe(true);
 await page.locator('.lnk').scrollIntoViewIfNeeded();await page.locator('.lnk').focus();await page.keyboard.press('Space');await act(page.locator('.graph-text button').filter({hasText:'开发工程师'}),info);await close(page);await expect(page.locator('.lnk')).toBeFocused();
 await openTask(page,'SIM-03',info);await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(baseURL).origin});
 const copy=action(page,'复制模拟催办说明');await act(copy,info);await expect(page.locator('#toast')).toContainText('已复制模拟说明');const text=await page.evaluate(()=>navigator.clipboard.readText());expect(text).toBe(await page.evaluate(()=>demoCopy(TASKS.find(t=>t.id==='SIM-03'),'urge')));expect(text).toContain('纯模拟 · 不可执行 · 不发送');expect(text).not.toContain('@');
 for(const mode of ['denied','unavailable']){
  await context.clearPermissions();await page.evaluate(mode=>{
   const native=document.execCommand.bind(document);window.__fallback={calls:0,result:null};document.execCommand=(...args)=>{window.__fallback.calls++;return window.__fallback.result=native(...args);};
   if(mode==='denied')navigator.clipboard.writeText=()=>Promise.reject(new DOMException('forced denial','NotAllowedError'));else Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true});
  },mode);
  await copy.focus();await act(copy,info);await expect.poll(()=>page.evaluate(()=>window.__fallback.calls)).toBeGreaterThan(0);await expect(copy).toBeFocused();
  const fallback=await page.evaluate(()=>window.__fallback);await info.attach('native-fallback-'+mode,{body:JSON.stringify(fallback),contentType:'application/json'});
  await expect(page.locator('#toast')).toContainText(fallback.result?'已复制模拟说明':'复制未成功');
 }
});
