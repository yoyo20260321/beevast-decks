// Dependency-free source checks only; never require or launch Playwright locally.
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const dir=__dirname;const root=path.resolve(dir,'../..');
for(const file of fs.readdirSync(dir).filter(n=>n.endsWith('.cjs')))new vm.Script(fs.readFileSync(path.join(dir,file),'utf8'),{filename:file});
const workflow=fs.readFileSync(path.join(root,'.github/workflows/workflow-map-browser.yml'),'utf8');
for(const pin of ['actions/checkout@11d5960a326750d5838078e36cf38b85af677262','actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020','actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02'])assert.ok(workflow.includes(pin));
for(const text of ['ubuntu-24.04','timeout-minutes: 15','contents: read','persist-credentials: false',"node-version: '22.23.4'",'retention-days: 7','if: always()','types: [opened, reopened, synchronize]','expected_sha:'])assert.ok(workflow.includes(text),text);
assert.doesNotMatch(workflow,/pull_request_target|self-hosted|secrets\.|write-all|contents: write|workflow_run/);
assert.match(workflow,/include-hidden-files: false/,'upload and manifest must agree on hidden artifacts');
const jobEnv=workflow.match(/^    env:\n([\s\S]*?)^    steps:/m)?.[1];
assert.ok(jobEnv,'browser job environment found');
assert.doesNotMatch(jobEnv,/\$\{\{\s*runner\./,'runner context is unavailable at jobs.<job_id>.env');
const lock=JSON.parse(fs.readFileSync(path.join(dir,'package-lock.json')));const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));
assert.equal(pkg.devDependencies['@playwright/test'],'1.56.1');assert.equal(pkg.engines.node,'22.23.4');
assert.deepEqual(lock.packages[''].devDependencies,pkg.devDependencies);
for(const name of ['@playwright/test','playwright','playwright-core','fsevents']){const p=lock.packages['node_modules/'+name];assert.match(p.integrity,/^sha512-/);assert.ok(p.resolved.startsWith('https://registry.npmjs.org/'));assert.equal(p.version,name==='fsevents'?'2.3.2':'1.56.1');}
const spec=fs.readFileSync(path.join(dir,'workflow.spec.cjs'),'utf8');
for(const id of 'ABCDEFGHI')assert.equal((spec.match(new RegExp("test\\('"+id+' ','g'))||[]).length,1);
assert.doesNotMatch(spec,/test\.(skip|fixme|only)|\.evaluate\([^\n]*(advanceTask|recordEvidence|simulate\()/);
const config=fs.readFileSync(path.join(dir,'playwright.config.cjs'),'utf8');for(const text of ['width:1440,height:1000','width:390,height:844','hasTouch:true','workers:1',"trace:'on'","screenshot:'on'","testMatch:'workflow.spec.cjs'"])assert.ok(config.includes(text),text);
console.log('PASS: CJS syntax, pinned Actions/permissions/triggers, integrity lock graph, two viewport projects and nine A-I case definitions. CI_NOT_RUN; no browser loaded.');
