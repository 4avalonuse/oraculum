/* ORACULUM — diagnóstico do modelo explicativo */
import {mean,std} from './engine.js';

export function diagnoseModel(model){
  if(!model?.available)return {available:false};
  const e=model.residuals||[],m=mean(e),s=std(e);
  const dw=e.length>1?e.slice(1).reduce((sum,v,i)=>sum+(v-e[i])**2,0)/Math.max(1,e.reduce((sum,v)=>sum+v*v,0)):NaN;
  const half=Math.max(2,Math.floor(e.length/2));
  const v1=std(e.slice(0,half))**2,v2=std(e.slice(half))**2;
  const varianceRatio=v1&&v2?Math.max(v1,v2)/Math.min(v1,v2):NaN;
  return {available:true,residualMean:m,residualStd:s,durbinWatson:dw,varianceRatio};
}
