const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=process.env.SOURCE_ROOT;
const port=Number(process.env.MAP_PORT||4173);
if(!root||!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid server configuration');
const html=fs.readFileSync(path.join(root,'demos/workflow-demo.html'));
http.createServer((req,res)=>{
 if(req.method!=='GET'||req.url!=='/demos/workflow-demo.html'){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
}).listen(port,'127.0.0.1');
