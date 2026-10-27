const fs=require('node:fs');const path=require('node:path');
function evidenceFiles(root){
 const files=[];
 function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  // Match upload-artifact's explicit hidden-file exclusion; these are transient work files, not required evidence.
  if(entry.name.startsWith('.'))continue;
  const target=path.join(dir,entry.name);
  if(entry.isSymbolicLink())throw new Error('Symlinks are outside the bounded evidence set');
  if(entry.isDirectory())walk(target);else if(path.relative(root,target)!=='manifest.json')files.push(path.relative(root,target));
 }}
 walk(root);return files;
}
function missingRequiredEvidence(root,manifest,files){
 const required=new Set(manifest.status==='PASS'?['source.html','results.json']:[]);
 for(const c of manifest.cases||[])for(const a of c.attachments||[])if(a.path)required.add(path.relative(root,a.path));
 return [...required].filter(name=>!files.includes(name));
}
module.exports={evidenceFiles,missingRequiredEvidence};
