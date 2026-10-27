const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=process.env.SOURCE_ROOT, out=process.env.MAP_ARTIFACT_DIR;
if(!root||!out)throw new Error('Source/evidence directories required');
fs.mkdirSync(out,{recursive:true});
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const file=path.join(out,'manifest.json');
const mode=process.env.MAP_MODE;
const canonical='https://yoyo20260321.github.io/beevast-decks/demos/workflow-demo.html';
async function main(){
 if(process.argv[2]==='prepare'){
  if(process.env.GITHUB_ACTIONS!=='true'||process.env.RUNNER_ENVIRONMENT!=='github-hosted'||process.env.RUNNER_OS!=='Linux')throw new Error('Official hosted Linux CI only');
  if(process.version!=='v22.23.4')throw new Error('Node version mismatch');
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));
  const sourceHEAD=git('rev-parse','HEAD');
  const expected=process.env.GITHUB_EVENT_NAME==='pull_request'?event.pull_request?.head.sha:event.inputs?.expected_sha;
  if(!/^[a-f0-9]{40}$/.test(expected||'')||expected!==sourceHEAD)throw new Error('Expected/source SHA mismatch');
  if(mode==='live'){
   if(process.env.GITHUB_EVENT_NAME!=='workflow_dispatch'||process.env.GITHUB_REF!=='refs/heads/main'||process.env.GITHUB_SHA!==expected)throw new Error('Live requires default main branch at expected merged commit');
  }else if(mode!=='candidate'||process.env.GITHUB_EVENT_NAME!=='pull_request'||!/^[a-f0-9]{40}$/.test(event.pull_request?.base.sha||''))throw new Error('Invalid candidate event/base');
  const paths=['demos/workflow-demo.html','.github/workflows/workflow-map-browser.yml',...fs.readdirSync(path.join(root,'tests/workflow-browser')).filter(n=>fs.statSync(path.join(root,'tests/workflow-browser',n)).isFile()).map(n=>'tests/workflow-browser/'+n),'tests/workflow-demo.test.cjs'];
  const sources=Object.fromEntries(paths.map(p=>[p,hash(fs.readFileSync(path.join(root,p)))]));
  const html=fs.readFileSync(path.join(root,'demos/workflow-demo.html'));
  fs.writeFileSync(path.join(out,'source.html'),html);
  const manifest={schema:1,mode,status:'CI_NOT_FINISHED',repository:process.env.GITHUB_REPOSITORY,pr:event.number||null,sourceHEAD,expectedHEAD:expected,eventBASE:event.pull_request?.base.sha||sourceHEAD,syntheticMergeSHA:mode==='candidate'?process.env.GITHUB_SHA:null,runID:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,job:process.env.GITHUB_JOB,event:process.env.GITHUB_EVENT_NAME,runner:{os:process.env.RUNNER_OS,environment:process.env.RUNNER_ENVIRONMENT,imageOS:process.env.ImageOS,imageVersion:process.env.ImageVersion},node:process.version,sources,sourceHTMLSHA256:hash(html),commands:['npm ci --ignore-scripts --no-audit --no-fund','playwright install --with-deps chromium','npm test'],cases:[],artifactIDs:'pending coordinator official API download',downloadSHA256:'pending coordinator official API download'};
  fs.writeFileSync(file,JSON.stringify(manifest,null,2));
  if(mode==='live'){
   const response=await fetch(canonical,{redirect:'error'});if(!response.ok)throw new Error('Live HTML HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());manifest.live={url:canonical,readAt:new Date().toISOString(),status:response.status,sha256:hash(bytes),expectedMergeSHA:expected,pagesBuild:'coordinator must bind official Pages build ID/commit'};
   fs.writeFileSync(path.join(out,'live.html'),bytes);fs.writeFileSync(file,JSON.stringify(manifest,null,2));
   if(hash(bytes)!==hash(html))throw new Error('Live HTML differs from expected source tree');
  }
 }else if(process.argv[2]==='tools'){
  const m=JSON.parse(fs.readFileSync(file));
  m.dependencies=JSON.parse(execFileSync('npm',['ls','--all','--json'],{encoding:'utf8'}));
  m.playwright=require('@playwright/test/package.json').version;
  if(m.playwright!=='1.56.1')throw new Error('Playwright mismatch');
  m.bundledBrowsers=require(path.join(path.dirname(require.resolve('playwright-core/package.json')),'browsers.json')).browsers;
  m.font=execFileSync('dpkg-query',['-W','-f=${Version}','fonts-noto-cjk'],{encoding:'utf8'});
  fs.writeFileSync(file,JSON.stringify(m,null,2));
 }else if(process.argv[2]==='finalize'){
  const m=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{status:'PREPARE_FAILED'};
  m.finishedAt=new Date().toISOString();m.jobStatus=process.env.MAP_JOB_STATUS;
  if(m.status!=='PASS'&&m.status!=='FAIL')m.status='BLOCKED';
  const paths=[];
  function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(p!==file)paths.push(p);}}
  walk(out);m.artifactFiles=Object.fromEntries(paths.map(p=>[path.relative(out,p),{bytes:fs.statSync(p).size,sha256:hash(fs.readFileSync(p))}]));
  fs.writeFileSync(file,JSON.stringify(m,null,2));
 }else throw new Error('Unknown provenance operation');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
