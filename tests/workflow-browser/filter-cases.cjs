// Exercise each axis independently, then positive/negative combinations; avoid redundant crossproduct traces.
const KPI_FILTER_CASES=[
 ...['','0','1','2','3','4','5','6','7'].map(stage=>({stage,role:'',query:''})),
 ...['admin5','zwen','pd','dev','qareview','te','support'].map(role=>({stage:'',role,query:''})),
 {stage:'3',role:'te',query:''},
 {stage:'2',role:'te',query:''},
 {stage:'',role:'',query:'开发'},
 {stage:'2',role:'dev',query:'开发'},
 {stage:'6',role:'admin5',query:'验收'},
 {stage:'',role:'',query:'NO_MATCH'}
];
module.exports={KPI_FILTER_CASES};
