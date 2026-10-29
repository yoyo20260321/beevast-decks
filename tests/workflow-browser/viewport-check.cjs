function viewportFits(metrics,expectedWidth){
 return Math.abs(metrics.innerWidth-expectedWidth)<=1 && metrics.clientWidth<=expectedWidth+1 && metrics.scrollWidth<=expectedWidth+1;
}
module.exports={viewportFits};
