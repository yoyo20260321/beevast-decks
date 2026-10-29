const fs=require('node:fs');const path=require('node:path');
const CASE_TITLES=[
 'A load layout and reachable panels',
 'B all phases six fields packages handoff DoD and close routes',
 'C all roles tasks highlight and retained selection after refresh',
 'D all KPI filters counts graph nodes hover keyboard and touch',
 'E events pause resume bounded feed and zero gate mutation',
 'F UI eight-gate journey quality failure new-head proof rebinding and recovery',
 'G release repair human acceptance DoD and completed code child parent hold',
 'H policy4 projected budget per-agent and dual quality role displays',
 'I native keyboard focus refresh nested dead-opener and clipboard fallback',
 'J simulated handoff order identity duplicates unknown hold stop and reset',
 'K simulated waits keep native select focus and dual quality capacity is atomic',
 'L quality signals distinguish review test CI and stale head or base without acceptance'
];
class EvidenceReporter{
 constructor(){this.cases=[];this.steps=new Map();}
 onStepEnd(test,result,step){if(!this.steps.has(result))this.steps.set(result,[]);this.steps.get(result).push({category:step.category,title:step.title,durationMs:step.duration,status:step.error?'FAIL':'PASS',error:step.error?.message});}
 onTestEnd(test,result){
  const attachment=result.attachments.find(a=>a.name==='environment');
  let actualEnvironment;
  if(attachment)actualEnvironment=JSON.parse(attachment.path?fs.readFileSync(attachment.path,'utf8'):attachment.body.toString());
  this.cases.push({actualEnvironment,id:test.title,project:test.parent.project().name,expectedStatus:test.expectedStatus,actualStatus:result.status,durationMs:result.duration,errors:result.errors.map(e=>e.message),assertions:this.steps.get(result)||[],attachments:result.attachments.map(a=>({name:a.name,contentType:a.contentType,path:a.path}))});}
 onEnd(result){
  const file=path.join(process.env.MAP_ARTIFACT_DIR,'manifest.json');const m=JSON.parse(fs.readFileSync(file));m.cases=this.cases;m.runnerTestStatus=result.status;
  const complete=this.cases.length===CASE_TITLES.length*2 && ['desktop','mobile'].every(project=>CASE_TITLES.every(title=>this.cases.filter(c=>c.project===project&&c.id===title).length===1));
  const assertionsComplete=this.cases.every(c=>c.expectedStatus==='passed'&&c.actualStatus==='passed'&&c.errors.length===0&&c.assertions.some(s=>s.category==='expect'&&s.status==='PASS')&&c.assertions.every(s=>s.status==='PASS'));
  const evidenceComplete=this.cases.every(c=>{
   const viewport=c.actualEnvironment?.viewport;
   const dimensions=c.project==='desktop'?[1440,1000]:[390,844];
   return !!c.actualEnvironment?.browser && viewport?.width===dimensions[0] && viewport?.height===dimensions[1] &&
    c.attachments.some(a=>a.name==='trace'&&a.contentType==='application/zip'&&a.path)&&
    c.attachments.some(a=>a.name==='case-screenshot'&&a.contentType==='image/png'&&a.path);
  });
  m.status=result.status==='passed'&&complete&&assertionsComplete&&evidenceComplete?'PASS':'FAIL';fs.writeFileSync(file,JSON.stringify(m,null,2));
  return {status:m.status==='PASS'?'passed':'failed'};
 }
}
module.exports=EvidenceReporter;
module.exports.CASE_TITLES=CASE_TITLES;
