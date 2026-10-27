// Source/matrix regression only; no browser imports or execution.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const spec=fs.readFileSync(path.join(__dirname,'workflow.spec.cjs'),'utf8');const config=fs.readFileSync(path.join(__dirname,'playwright.config.cjs'),'utf8');
assert.ok(spec.includes('visualViewport'),'capture real visual viewport around native actions');
assert.ok(spec.includes('geometry-actions'),'retain bounds/hit/scroll evidence');
assert.ok(spec.includes('pointerdown')&&spec.includes('touchstart'),'capture actual native event targets');
assert.ok(spec.includes('await locator.tap()'),'preserve native mobile tap');
assert.doesNotMatch(spec,/force:\s*true|test\.(skip|fixme|only)/);
assert.doesNotMatch(config,/\['html'/,'do not duplicate per-case traces into HTML report');
assert.match(config,/actionTimeout:10000/,'fail native actions in bounded time, leaving screenshot/teardown budget');
const {KPI_FILTER_CASES}=require('./filter-cases.cjs');
for(const stage of ['','0','1','2','3','4','5','6','7'])assert.ok(KPI_FILTER_CASES.some(c=>c.stage===stage&&!c.role&&!c.query));
for(const role of ['','admin5','zwen','pd','dev','qareview','te','support'])assert.ok(KPI_FILTER_CASES.some(c=>c.role===role&&!c.stage&&!c.query));
assert.ok(KPI_FILTER_CASES.some(c=>c.stage==='3'&&c.role==='te'));
assert.ok(KPI_FILTER_CASES.some(c=>c.stage==='2'&&c.role==='te'));
assert.ok(KPI_FILTER_CASES.some(c=>c.query==='开发'&&!c.role&&!c.stage));
assert.ok(KPI_FILTER_CASES.some(c=>c.query==='开发'&&c.role==='dev'&&c.stage==='2'));
assert.ok(KPI_FILTER_CASES.some(c=>c.query==='NO_MATCH'));
assert.ok(KPI_FILTER_CASES.length<30);
console.log(`PASS: mobile diagnostic/native-action contract and ${KPI_FILTER_CASES.length} meaningful filter scenarios per KPI; browser root cause remains unconfirmed until official CI.`);

const {viewportFits}=require('./viewport-check.cjs');
assert.equal(viewportFits({innerWidth:466,clientWidth:466,scrollWidth:466},390),false,'official mobileB trace width466 must not pass configured390 layout');
assert.equal(viewportFits({innerWidth:390,clientWidth:390,scrollWidth:390},390),true);
assert.equal(viewportFits({innerWidth:390,clientWidth:390,scrollWidth:450},390),false);
assert.equal(viewportFits({innerWidth:1440,clientWidth:1440,scrollWidth:1440},1440),true);
