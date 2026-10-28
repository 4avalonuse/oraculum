/* Cálculo científico das janelas; sem DOM ou estado da interface. */
import {analyzeSeries,alignSeries} from './engine.js';
import {runExplanatoryModel} from './explanatory-model.js';
import {diagnoseModel} from './model-diagnostics.js';
import {validateModelTwoWays,validateResidualDiagnostics} from './model-validation.js';
import {ScientificStatus,inspectCalendarInference} from './validation/sample-quality.js';

export function analyzeTimelineWindows({slots,timelineRows,interval,returnMode,rollingWindow,layouts,alignment,chartMode,sameWindowDates}){
   let analysisRows,commonSeries,independentTimelines;
   const windowedSeries=slots.map(slot=>{const rows=timelineRows[slot.key];return {...slot,candles:slot.candles.filter(c=>rows.some(row=>Number(row.timestamp)===Number(c.timestamp)))};});
   // A repeated asset is valid for period-to-period comparison, but must not enter a multivariate model twice.
   const modelSeries=windowedSeries.filter((slot,index)=>windowedSeries.findIndex(other=>other.assetKey===slot.assetKey)===index);
   const commonRows=alignSeries(modelSeries,interval),calendarCheck=inspectCalendarInference({seriesCount:modelSeries.length,alignedRows:commonRows}),hasCommon=calendarCheck.status===ScientificStatus.APPROVED;
   const commonResult=hasCommon?analyzeSeries(commonRows,modelSeries,interval,{returnMode,rollingWindow}):null;
   const individualResults=slots.map(slot=>({slot,result:analyzeSeries(timelineRows[slot.key],[slot],interval,{returnMode,rollingWindow})}));
   const primaryRows=timelineRows[slots[0].key],primaryResult=individualResults[0].result;
   let result;
   if(hasCommon){
     result=commonResult;
     result.relations=commonResult.relations;
     result.explanatoryModel=runExplanatoryModel(commonRows,modelSeries,{returnMode});
     result.modelDiagnostics=diagnoseModel(result.explanatoryModel);result.modelValidation=validateModelTwoWays(result.explanatoryModel);result.residualValidation=validateResidualDiagnostics(result.explanatoryModel,result.modelDiagnostics);
     analysisRows=commonRows;commonSeries=modelSeries;independentTimelines=!sameWindowDates(slots);
   }else{
     result={...primaryResult,relations:[],temporal:{method:slots.length<2?'single selected series; no cross-series inference requested':'individual selected windows; no common calendar sample with enough observations for cross-series inference',sharedRows:0,firstBucket:null,lastBucket:null,gaps:0},alignedObservations:0};
     result.explanatoryModel={available:false,reason:slots.length<2?'Selecione outra série temporal para comparar ativos.':modelSeries.length<2?'Há apenas um ativo distinto; séries repetidas podem ser comparadas por período, mas não são duplicadas no modelo multivariado.':'As janelas selecionadas não têm pelo menos 10 observações em datas comuns; o modelo multivariado foi omitido para evitar pareamento artificial.'};
     result.modelDiagnostics={available:false,heteroskedasticity:{available:false}};
     result.modelValidation={status:'NOT_CHECKED',passed:0,total:0,checks:[],message:'Não aplicável sem amostra comum suficiente.'};
     result.residualValidation={status:'NOT_CHECKED',passed:0,total:0,checks:[],reason:'Modelo multivariado não estimado.'};
     analysisRows=primaryRows;commonSeries=[slots[0]];independentTimelines=true;
   }
   result.series={};
   for(const {slot,result:individual} of individualResults)result.series[slot.key]=individual.series[slot.key];
   if(hasCommon){
     result.audit={...commonResult.audit,series:Object.assign({},...individualResults.map(x=>x.result.audit?.series||{})),relations:commonResult.audit?.relations||[]};
   }else result.audit={...primaryResult.audit,series:Object.assign({},...individualResults.map(x=>x.result.audit?.series||{})),relations:[]};
   result.timelineVisibility=layouts.map((x,i)=>({slotIndex:i,visible:x.visibleCount,total:x.duration,hidden:x.hiddenCount})).filter(x=>x.hidden>0);
   result.timelineAlignment=alignment;result.chartMode=chartMode;
   result.interval=interval;result.returnMode=returnMode;result.rollingWindow=rollingWindow;result.observations=primaryRows.length;result.alignedObservations=hasCommon?commonRows.length:0;
   result.rowsStart=primaryRows[0].timestamp;result.rowsEnd=primaryRows.at(-1).timestamp;result.periodDays=(result.rowsEnd-result.rowsStart)/86400000;
   result.temporal={...(result.temporal||{}),method:hasCommon?'individual native-window statistics; cross-series inference on shared calendar buckets within selected windows':slots.length<2?'single selected series; no cross-series inference requested':modelSeries.length<2?'only one distinct asset; repeated periods excluded from multivariate inference':'individual selected windows; no valid shared sample for cross-series inference',sharedRows:hasCommon?commonRows.length:0};
   return {result,rows:analysisRows,commonSeries,independentTimelines};
}
