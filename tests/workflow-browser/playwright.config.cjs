if(process.env.GITHUB_ACTIONS!=='true'||process.env.RUNNER_ENVIRONMENT!=='github-hosted')throw new Error('Browser execution is authorized only on official hosted CI');
const {defineConfig}=require('@playwright/test');
const path=require('node:path');
const live=process.env.MAP_MODE==='live';
const port=Number(process.env.MAP_PORT||4173);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid loopback port');
const baseURL=live?'https://yoyo20260321.github.io/beevast-decks/demos/workflow-demo.html':`http://127.0.0.1:${port}/demos/workflow-demo.html`;
const evidence=process.env.MAP_ARTIFACT_DIR;
if(!evidence)throw new Error('MAP_ARTIFACT_DIR required');
module.exports=defineConfig({
 testDir:__dirname,testMatch:'workflow.spec.cjs',fullyParallel:false,workers:1,retries:0,timeout:90000,globalTimeout:360000,
 expect:{timeout:7000},outputDir:path.join(evidence,'cases'),
 reporter:[['list'],['json',{outputFile:path.join(evidence,'results.json')}],['html',{outputFolder:path.join(evidence,'report'),open:'never'}],[path.join(__dirname,'reporter.cjs')]],
 use:{browserName:'chromium',baseURL,trace:'on',screenshot:'on',video:'off',storageState:undefined,reducedMotion:'reduce'},
 projects:[{name:'desktop',use:{viewport:{width:1440,height:1000},hasTouch:false,isMobile:false}},{name:'mobile',use:{viewport:{width:390,height:844},hasTouch:true,isMobile:true}}],
 webServer:live?undefined:{command:'node server.cjs',url:baseURL,reuseExistingServer:false,timeout:20000,env:{...process.env,MAP_PORT:String(port)}}
});
