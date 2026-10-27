const fs=require('node:fs');const path=require('node:path');
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
  const complete=['desktop','mobile'].every(project=>'ABCDEFGHI'.split('').every(id=>this.cases.some(c=>c.project===project&&c.id.startsWith(id+' ')&&c.actualStatus==='passed'&&c.assertions.some(s=>s.category==='expect'))));
  const evidenceComplete=this.cases.every(c=>c.actualEnvironment?.browser&&c.actualEnvironment?.viewport&&c.attachments.some(a=>a.name==='trace')&&c.attachments.some(a=>a.name==='case-screenshot'));
  m.status=result.status==='passed'&&complete&&evidenceComplete&&this.cases.length===18?'PASS':'FAIL';fs.writeFileSync(file,JSON.stringify(m,null,2));
  return {status:m.status==='PASS'?'passed':'failed'};
 }
}
module.exports=EvidenceReporter;
