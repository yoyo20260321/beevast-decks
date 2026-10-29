// Local fixture regression for bounded artifact enumeration; no browser/dependency imports.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {evidenceFiles,missingRequiredEvidence}=require('./evidence-files.cjs');
const root=process.argv[2];if(!root||!path.basename(root).startsWith('dev-ci-'))throw new Error('Explicit dev-ci-* evidence fixture directory required');
fs.mkdirSync(path.join(root,'cases','case1'),{recursive:true});fs.mkdirSync(path.join(root,'cases','.transient'),{recursive:true});
for(const [name,data] of Object.entries({'source.html':'html','results.json':'{}','manifest.json':'{}','cases/case1/trace.zip':'trace','cases/case1/test-failed.png':'image','.last-run.json':'transient','cases/.transient/temporary.zip':'transient'}))fs.writeFileSync(path.join(root,name),data);
const files=evidenceFiles(root);assert.deepEqual(files.sort(),['cases/case1/test-failed.png','cases/case1/trace.zip','results.json','source.html']);
const manifest={status:'PASS',cases:[{attachments:[{path:path.join(root,'cases/case1/trace.zip')},{path:path.join(root,'cases/case1/test-failed.png')},{name:'body-only-json'}]}]};
assert.deepEqual(missingRequiredEvidence(root,manifest,files),[]);
manifest.cases[0].attachments.push({path:path.join(root,'cases/.transient/temporary.zip')});assert.equal(missingRequiredEvidence(root,manifest,files).length,1,'required hidden evidence must fail, never be silently dropped');
assert.ok(missingRequiredEvidence(root,{status:'PASS',cases:[]},files.filter(f=>f!=='results.json')).includes('results.json'));
console.log('PASS artifact enumeration: transient hidden files excluded; visible screenshot/trace/report/source retained; missing or hidden required files fail.');

const {spawnSync}=require('node:child_process');
const good={status:'PASS',cases:[{attachments:[{path:path.join(root,'cases/case1/trace.zip')},{path:path.join(root,'cases/case1/test-failed.png')}]}]};
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(good));
const finalize=()=>spawnSync(process.execPath,[path.join(__dirname,'provenance.cjs'),'finalize'],{encoding:'utf8',env:{...process.env,SOURCE_ROOT:path.resolve(__dirname,'../..'),MAP_ARTIFACT_DIR:root,MAP_JOB_STATUS:'success'}});
assert.equal(finalize().status,0);let output=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));assert.deepEqual(Object.keys(output.artifactFiles).sort(),files.sort());assert.deepEqual(output.evidenceCoverage.missingRequired,[]);
good.cases[0].attachments.push({path:path.join(root,'cases/.transient/temporary.zip')});fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(good));
assert.notEqual(finalize().status,0);output=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));assert.equal(output.status,'FAIL');assert.deepEqual(output.evidenceCoverage.missingRequired,['cases/.transient/temporary.zip']);
console.log('PASS actual provenance finalizer fixture: exact visible hash graph and explicit failure for a missing required upload.');
