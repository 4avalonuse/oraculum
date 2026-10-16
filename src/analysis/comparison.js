/* ORACULUM — análise investigativa sob demanda */
import {analyzeSeries,alignSeries} from './engine.js';
import {openInfo} from './explanations.js';
import {openDataTable} from './data-table.js';
import {openModal} from './analysis-modal.js';
import {wireMetricHelp} from './metric-help.js';
import {runExplanatoryModel} from './explanatory-model.js';
import {diagnoseModel} from './model-diagnostics.js';
import {validateModelTwoWays,validateResidualDiagnostics} from './model-validation.js';
import {fmt,pct,date,metric,statBlock} from './view/formatters.js';
import {wireSummaryCopy} from './view/copy-results.js';
import {buildConclusion,buildMetricEducation,wireReportButtons} from './interpretation.js';


export function attachComparisonAnalysis({dataClient,normalizeCandles,getCandles,getInterval,getActiveSymbol,assets}){
 wireMetricHelp(document);
 const $=s=>document.querySelector(s),state={rows:null,result:null,selected:[],series:[],markers:{start:0,base:0,end:0}};
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const markerDate=(rows,i)=>rows[i]?date(rows[i].timestamp):'—';

 const recomputeSample=()=>{
   if(!state.rows?.length||!state.series?.length)return;
   const start=state.markers.start,end=state.markers.end;
   const sample=state.rows.slice(start,end+1);
   if(sample.length<10)return;
   const returnMode=document.querySelector('#analysis-return')?.value||'log';
   const rollingWindow=Number(document.querySelector('#analysis-window')?.value||30);
   const calendar=state.series.some(s=>s.category&&!['crypto','test'].includes(s.category))?'trading':'continuous';
   const result=analyzeSeries(sample,state.series,getInterval()||'1d',{returnMode,rollingWindow,calendar});
   result.explanatoryModel=runExplanatoryModel(sample,state.series,{returnMode});
   result.modelDiagnostics=diagnoseModel(result.explanatoryModel);result.modelValidation=validateModelTwoWays(result.explanatoryModel);result.residualValidation=validateResidualDiagnostics(result.explanatoryModel,result.modelDiagnostics);
   result.rowsStart=sample[0].timestamp;result.rowsEnd=sample.at(-1).timestamp;
   result.periodDays=(result.rowsEnd-result.rowsStart)/86400000;
   state.result=result;
   render(result,state.series);
 };

 const renderMarkerTimeline=()=>{
   const host=$('#comparison-timeline');if(!host||!state.rows?.length)return;
   const max=Math.max(1,state.rows.length-1),m=state.markers;
   const make=(key,label,cls)=>'<button class="cmp-marker '+cls+'" data-marker="'+key+'" style="left:'+((m[key]/max)*100)+'%" aria-label="'+label+' '+markerDate(state.rows,m[key])+'"><span>'+label+'</span><b>'+markerDate(state.rows,m[key])+'</b></button>';
   host.innerHTML='<div class="cmp-timeline-track"></div>'+make('start','INÍCIO','marker-start')+make('base','BASE 100','marker-base')+make('end','FIM','marker-end');
   host.querySelectorAll('.cmp-marker').forEach(btn=>{btn.addEventListener('pointerdown',e=>{e.preventDefault();const key=btn.dataset.marker;btn.setPointerCapture?.(e.pointerId);const move=ev=>{const rect=host.getBoundingClientRect(),x=clamp(ev.clientX-rect.left,0,rect.width),idx=Math.round((x/rect.width)*max);const min=key==='base'?m.start:key==='end'?m.base:0,maxAllowed=key==='start'?m.base:key==='base'?m.end:max;m[key]=clamp(idx,min,maxAllowed);renderMarkerTimeline();renderChart(state.rows,state.series);const fresh=document.querySelector('#comparison-timeline .cmp-marker[data-marker="'+key+'"]');fresh?.setPointerCapture?.(ev.pointerId)};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);recomputeSample()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up)})});
 };

 const renderChart=(rows,series)=>{
   const host=$('#comparison-chart');if(!host||!rows.length)return;
   const w=Math.max(320,host.clientWidth||800),h=280,p={l:48,r:18,t:18,b:32};
   const start=state.markers.start,base=state.markers.base,end=state.markers.end,view=rows.slice(start,end+1),baseRow=rows[base]||view[0];
   const normalized=series.map(s=>view.map(r=>100*r[s.key]/baseRow[s.key]));
   const all=normalized.flat(),lo=Math.log(Math.min(...all)),hi=Math.log(Math.max(...all));
   const t0=view[0]?.timestamp??0,t1=view.at(-1)?.timestamp??t0,span=Math.max(1,t1-t0);
   const line=vals=>vals.map((v,i)=>{const ts=view[i]?.timestamp??t0,x=p.l+((ts-t0)/span)*(w-p.l-p.r),y=h-p.b-(Math.log(Math.max(.0001,v))-lo)/(hi-lo||1)*(h-p.t-p.b);return x.toFixed(2)+','+y.toFixed(2)}).join(' ');
   const polylines=normalized.map((v,i)=>'<polyline points="'+line(v)+'" class="cmp-line cmp-'+i+'"/>').join('');
   host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img" aria-label="Comparação em base 100 e escala logarítmica"><line x1="'+p.l+'" x2="'+p.l+'" y1="'+p.t+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h-p.b)+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h/2)+'" y2="'+(h/2)+'" class="cmp-grid"/>'+polylines+'<text x="'+p.l+'" y="'+(h-8)+'">'+date(view[0].timestamp)+'</text><text x="'+(w-p.r)+'" y="'+(h-8)+'" text-anchor="end">'+date(view.at(-1).timestamp)+'</text><text x="'+(p.l+6)+'" y="'+(h/2-6)+'">100 = '+date(baseRow.timestamp)+'</text></svg>';
   const legend=$('#comparison-legend');if(legend)legend.innerHTML=series.map((s,i)=>'<span><i class="legend-'+i+'"></i>'+s.symbol+'</span>').join('');
 };

 const renderContext=(result,series)=>{
   const primary=series[0],targets=series.slice(1).map(s=>s.symbol).join(' + ')||'nenhum alvo selecionado';
   $('#analysis-context').innerHTML='<div class="context-row"><div><span>ATIVO INVESTIGADO</span><strong>'+primary.symbol+'</strong></div><div><span>COMPARAÇÃO / FATORES</span><strong>'+targets+'</strong></div><div><span>PERÍODO</span><strong>'+date(result.rowsStart)+' → '+date(result.rowsEnd)+'</strong></div><div><span>INTERVALO</span><strong>'+result.interval+'</strong></div><div><span>OBSERVAÇÕES</span><strong>'+result.observations+'</strong></div></div><div class="context-method"><div><b>DESENHO DA INVESTIGAÇÃO</b><span>Estatísticas individuais usam cada série nativa; correlações, beta e regressão usam somente buckets de calendário comuns. A amostra INÍCIO → FIM limita ambos os caminhos.</span></div><button id="show-data-table" type="button">VER DADOS UTILIZADOS ↗</button><button id="show-method" type="button">MÉTODO ?</button></div><div class="context-note"><b>Como ler:</b> o ativo investigado acompanha o ativo principal do gráfico. As estatísticas de cada ativo usam seus próprios candles dentro do período selecionado. Relações entre ativos usam apenas datas/buckets comuns, com retornos close-to-close sincronizados. O índice é calculado como <b>100 × P(t) / P(base)</b>. A escala vertical é logarítmica; o eixo horizontal respeita o tempo real dos timestamps. <b>INÍCIO e FIM definem a amostra estatística.</b> BASE 100 define apenas a âncora visual da comparação.</div>';
   $('#analysis-context').classList.remove('is-hidden');
 };


 function auditNumber(value,digits=8){
   if(value===null||value===undefined||!Number.isFinite(Number(value)))return 'indefinido';
   const n=Number(value);
   if(n!==0&&Math.abs(n)<1e-7)return n.toExponential(3);
   return n.toLocaleString('pt-BR',{maximumFractionDigits:digits});
 }
 function auditPct(value){return Number.isFinite(value)?auditNumber(value*100,6)+'%':'indefinido'}
 function auditDate(value){return Number.isFinite(Number(value))?new Date(Number(value)).toISOString().slice(0,10):'indefinida'}
 function auditTimestamp(value){return Number.isFinite(Number(value))?new Date(Number(value)).toISOString():'indefinido'}
 function buildAuditReport(result,series,rows,markers){
   const sampleRows=Array.isArray(rows)?rows.slice(markers?.start??0,(markers?.end??(rows.length-1))+1):[];
   const mode=result.returnMode==='simple'?'simples':'logarítmico';
   const lines=[
     'ORACULUM — RELATÓRIO PARA AUDITORIA ESTATÍSTICA',
     '',
     'INSTRUÇÕES PARA A AUDITORIA',
     'Verifique a coerência matemática dos resultados e das fórmulas; não presuma que o código está correto só porque produziu números.',
     'Separe: (1) confirmado, (2) suspeito, (3) impossível de concluir com este resumo. Explique o motivo e indique o arquivo/fórmula a conferir.',
     'Confira especialmente retornos, CAGR, volatilidade anualizada, drawdown, VaR/ES, covariância, beta/alpha, OLS, erros-padrão HAC, p-valores e diagnósticos dos resíduos.',
     'Não afirme causalidade. Se faltar informação para validar um resultado, peça apenas o trecho exato de dados ou código necessário; não invente valores esperados.',
     '',
     '1. CONFIGURAÇÃO E AMOSTRA',
     'Ativo investigado: '+(series[0]?.symbol||'indefinido'),
     'Comparações: '+(series.slice(1).map(s=>s.symbol).join(', ')||'nenhuma'),
     'Período comum: '+auditDate(result.rowsStart)+' a '+auditDate(result.rowsEnd),
     'Intervalo solicitado: '+(result.interval||'indefinido')+' | Tipo de retorno: '+mode,
     'Desenho temporal: estatísticas individuais em observações nativas; relações e modelo multivariado em buckets comuns. Retornos comuns são close-to-close e podem abranger mais de 1 dia de calendário.',
     'Buckets comuns: '+(result.temporal?.sharedRows??result.observations)+' | lacunas acima de 1,5 dia entre timestamps comuns: '+(result.temporal?.gaps??'não calculado'),
     'Observações de preço na amostra comum: '+(sampleRows.length||result.observations||'indefinidas'),
     'Retornos válidos por série: '+series.map(s=>s.symbol+'='+((result.series?.[s.key]?.returns||[]).filter(Number.isFinite).length)).join(' | '),
     'Janela móvel: '+(result.rollingWindow??'indefinida')+' | Períodos anualizados: '+(result.periods??'indefinido'),
     'Marcadores da amostra: início '+auditDate(sampleRows[0]?.timestamp)+' | base visual '+auditDate(rows?.[markers?.base]?.timestamp)+' | fim '+auditDate(sampleRows.at(-1)?.timestamp),
     'Nota: a base 100 afeta o gráfico comparativo, não deve alterar as estatísticas calculadas sobre a amostra selecionada.',
     '',
     '2. RESULTADOS POR SÉRIE'
   ];
   for(const s of series){
     const x=result.series?.[s.key];if(!x)continue;
     lines.push(
       '',s.symbol,
       'Preços inicial/final: '+auditNumber(x.start)+' / '+auditNumber(x.end),
       'Amostra nativa: '+(x.nativeObservations??'—')+' preços / '+(x.validReturns??'—')+' retornos válidos | anualização: '+(x.annualizationCalendar||'não informada')+' ('+(x.annualizationPeriods??'—')+' períodos/ano)',
       'Retorno acumulado: '+auditPct(x.total)+' | CAGR: '+auditPct(x.cagr)+' | Volatilidade anualizada: '+auditPct(x.vol),
       'Drawdown máximo: '+auditPct(x.drawdown)+' | Sharpe: '+auditNumber(x.sharpe,6)+' | Sortino: '+auditNumber(x.sortino,6)+' | Win rate: '+auditPct(x.winRate),
       'Retorno médio: '+auditPct(x.mean)+' | Mediana: '+auditPct(x.median)+' | Desvio-padrão por intervalo: '+auditPct(x.std),
       'Variância: '+auditNumber(x.variance,12)+' | Erro-padrão da média: '+auditPct(x.se),
       'Melhor/pior retorno: '+auditPct(x.best)+' / '+auditPct(x.worst),
       'Assimetria: '+auditNumber(x.skewness,6)+' | Curtose excedente: '+auditNumber(x.excessKurtosis,6),
       'VaR 95%/99%: '+auditPct(x.var95)+' / '+auditPct(x.var99)+' | ES 95%/99%: '+auditPct(x.es95)+' / '+auditPct(x.es99),
       'Calmar: '+auditNumber(x.calmar,6)+' | ATL/ATH: '+auditNumber(x.atl)+' / '+auditNumber(x.ath),
       'Jarque–Bera: estatística '+auditNumber(x.jarqueBera?.stat,8)+' | p '+auditNumber(x.jarqueBera?.p,8)
     );
   }
   lines.push('','3. RELAÇÕES ENTRE O ATIVO INVESTIGADO E AS SÉRIES COMPARADAS');
   for(const r of result.relations||[]){
     lines.push(
       '',r.primary+' × '+r.target,
       'Correlação: '+auditNumber(r.correlation,8)+' | Covariância: '+auditNumber(r.covariance,12),
       'Beta: '+auditNumber(r.beta,8)+' | Alpha: '+auditNumber(r.alpha,10)+' | R²: '+auditPct(r.r2),
       'Correlação móvel final: '+auditNumber(r.rolling,8),
       'Lead/Lag escolhido: '+(r.leadLag?.lag??'indefinido')+' intervalos | correlação correspondente: '+auditNumber(r.leadLag?.corr,8),
       'Defasagem absoluta entre timestamps-fonte: mediana '+auditNumber(r.temporalAlignment?.timestampOffsetMedianHours,2)+' h | máxima '+auditNumber(r.temporalAlignment?.timestampOffsetMaxHours,2)+' h ('+(r.temporalAlignment?.timestampOffsetObservations??0)+' buckets com metadados)',
       'Intervalo nativo mediano entre observações: referência '+auditNumber(r.temporalAlignment?.primaryElapsedDaysMedian,2)+' dias | alvo '+auditNumber(r.temporalAlignment?.targetElapsedDaysMedian,2)+' dias',
       'Limitação temporal: '+(r.timingCaveat||'horários de fechamento podem não ser simultâneos; verificar timestamps-fonte.')
     );
   }
   const m=result.explanatoryModel,d=result.modelDiagnostics;
   const validation=result.modelValidation;lines.push('','CONFERÊNCIA NUMÉRICA ENTRE IMPLEMENTAÇÕES: '+(validation?.status||'NOT_CHECKED')+' · '+(validation?.passed??0)+'/'+(validation?.total??0)+' verificações');if(validation?.reason)lines.push('Motivo da não verificação: '+validation.reason);for(const item of validation?.checks||[])lines.push(item.status+' · '+item.name+' | cálculo A='+auditNumber(item.primary,12)+' | cálculo B='+auditNumber(item.reference,12));
   const rv=result.residualValidation;lines.push('','RECOMPUTAÇÃO INDEPENDENTE DOS DIAGNÓSTICOS RESIDUAIS: '+(rv?.status||'NOT_CHECKED')+' · '+(rv?.passed??0)+'/'+(rv?.total??0)+' verificações');if(rv?.reason)lines.push('Motivo: '+rv.reason);for(const item of rv?.checks||[])lines.push(item.status+' · '+item.name+' | observado='+auditNumber(item.primary,12)+' | referência independente='+auditNumber(item.reference,12));if(Number.isFinite(rv?.firstLagContributionToLjungBox))lines.push('Contribuição mínima da defasagem 1 ao Q de Ljung–Box: '+auditNumber(rv.firstLagContributionToLjungBox,10));if(rv?.warning)lines.push('Limitação: '+rv.warning);
   lines.push('','4. MODELO MULTIVARIADO E RESÍDUOS');
   if(!m?.available)lines.push('Modelo não estimado: '+(m?.reason||'motivo não informado'));
   else{
     lines.push(
       'Alvo: '+m.target+' | Preditores: '+(m.predictors||[]).join(', '),
       'Observações: '+m.observations+' | R²: '+auditPct(m.r2)+' | R² ajustado: '+auditPct(m.adjustedR2),
       'F: '+auditNumber(m.f,8)+' | p do F: '+auditNumber(m.fP,10)+' | graus de liberdade residuais: '+(m.df??'indefinidos'),
       'RMSE (SSE/n): '+auditNumber(m.rmse,12)+' | erro-padrão residual (SSE/gl): '+auditNumber(m.residualStandardError,12)+' | SSE: '+auditNumber(m.sse,12)+' | SST: '+auditNumber(m.sst,12)+' | HAC lag: '+(m.hacLag??'indefinido')
     );
     lines.push('Coeficientes OLS (β | erro-padrão | t | p | IC95%):');
     for(const c of m.coefficients||[])lines.push(c.name+': '+auditNumber(c.beta,10)+' | '+auditNumber(c.se,10)+' | '+auditNumber(c.t,8)+' | '+auditNumber(c.p,10)+' | ['+auditNumber(c.ciLow,10)+', '+auditNumber(c.ciHigh,10)+']');
     lines.push('Inferência HAC: '+(m.hacMethod||'Newey–West')+' | correção finita '+(m.hacFiniteSampleCorrection||'não informada')+' | p-valores '+(m.hacPValueMethod||'método não informado')+'.');
      lines.push('HAC ajusta a matriz de covariância para dependência serial/heterocedasticidade; p-valores são assintóticos e não garantem bom desempenho em amostras pequenas.');
      lines.push('Coeficientes HAC/Newey–West (β | HAC SE | HAC t | HAC p):');
     for(const c of m.hacCoefficients||[])lines.push(c.name+': '+auditNumber(c.beta,10)+' | '+auditNumber(c.hacSe,10)+' | '+auditNumber(c.hacT,8)+' | '+auditNumber(c.hacP,10));
     lines.push('VIF: '+(m.vif||[]).map((v,i)=>(m.predictors?.[i]||('preditor '+(i+1)))+'='+auditNumber(v.vif,8)).join(' | '));
     if(d?.available)lines.push(
       'Resíduos: média '+auditNumber(d.residualMean,12)+' | desvio-padrão '+auditNumber(d.residualStd,12)+' | máximo absoluto '+auditNumber(d.maxAbsResidual,12),
       'Durbin–Watson: '+auditNumber(d.durbinWatson,8)+' (numerador '+auditNumber(d.durbinWatsonNumerator,10)+' / denominador '+auditNumber(d.durbinWatsonDenominator,10)+') | correlação residual lag 1: '+auditNumber(d.residualLag1Correlation,8),
       'Ljung–Box: Q='+auditNumber(d.ljungBox?.stat,8)+', gl='+ (d.ljungBox?.df??'indefinidos')+', p='+auditNumber(d.ljungBox?.p,10)+' | n resíduos='+ (d.ljungBox?.residualCount??'indefinido'),
       'Espaçamento temporal: '+(d.temporalSpacing?.status||'TIMING_UNKNOWN')+' | intervalos n='+ (d.temporalSpacing?.intervalCount??0)+' | min/mediana/máx (dias)='+auditNumber(d.temporalSpacing?.minDays,4)+' / '+auditNumber(d.temporalSpacing?.medianDays,4)+' / '+auditNumber(d.temporalSpacing?.maxDays,4)+' | inferência formal elegível='+String(Boolean(d.temporalSpacing?.formalInferenceEligible)),
       ...(d.temporalSpacing?.warning?[d.temporalSpacing.warning]:[]),
       'Razão de variâncias entre metades: '+auditNumber(d.varianceRatio,8)
     );
     if(d?.heteroskedasticity?.available){
       lines.push('','Diagnósticos de heterocedasticidade / variância condicional:');
       for(const test of d.heteroskedasticity.tests||[])lines.push(test.method+' | '+(test.available?'LM='+auditNumber(test.statistic,8)+' | gl='+test.df+' | p='+auditNumber(test.pValue,10)+' | '+test.interpretation:'INCONCLUSIVO | '+test.reason));
       for(const note of d.heteroskedasticity.notes||[])lines.push('Nota metodológica: '+note);
     }
   }
   lines.push('','5. CARIMBOS DE CÁLCULO E CONSISTÊNCIA');
   lines.push('Versão matemática: '+(result.audit?.mathVersion||'indefinida')+' | Escopo: consistência interna; não equivale a validação independente.');
   for(const s of series){
     const stamped=result.audit?.series?.[s.key];
     if(!stamped)continue;
     lines.push('',s.symbol+' · '+stamped.validReturns+' retornos válidos / '+stamped.observations+' linhas de preço');
     for(const [name,stamp] of Object.entries(stamped.calculations||{})){
       lines.push(name+' | '+stamp.id+' | estado='+stamp.status+' | n='+stamp.observations);
       lines.push('  Fórmula: '+stamp.formula);
       if(stamp.checks?.length)for(const check of stamp.checks)lines.push('  Verificação '+check.name+': '+check.status+' | observado='+auditNumber(check.actual,12)+' | esperado='+auditNumber(check.expected,12));
       if(stamp.assumptions?.length)lines.push('  Pressupostos: '+stamp.assumptions.join('; '));
     }
   }
   for(const stamp of result.audit?.relations||[]){
     lines.push('',stamp.id+' | '+stamp.status+' | n='+stamp.observations+' | '+stamp.formula);
     for(const check of stamp.checks||[])lines.push('  Verificação '+check.name+': '+check.status+' | observado='+auditNumber(check.actual,12)+' | referência='+auditNumber(check.expected,12));
   }
   lines.push('','6. TRECHOS DE DADOS PARA CONFERÊNCIA RÁPIDA');
   if(sampleRows.length){
     const indices=[...new Set([0,1,2,Math.floor((sampleRows.length-1)/2)-1,Math.floor((sampleRows.length-1)/2),Math.floor((sampleRows.length-1)/2)+1,sampleRows.length-3,sampleRows.length-2,sampleRows.length-1])].filter(i=>i>=0&&i<sampleRows.length).sort((a,b)=>a-b);
     lines.push('Amostra curta de preços alinhados; serve para inspeção pontual, não para recalcular sozinha toda a regressão.');
     lines.push('Data do bucket | '+series.map(s=>s.symbol+' preço @ timestamp-fonte UTC').join(' | '));
     for(const i of indices)lines.push(auditDate(sampleRows[i].timestamp)+' | '+series.map(s=>auditNumber(sampleRows[i][s.key],8)+' @ '+auditTimestamp(sampleRows[i].__sourceTimestamps?.[s.key])).join(' | '));
   }else lines.push('Trechos de preços não disponíveis nesta exportação.');
   lines.push('','Se um cálculo não puder ser validado com este resumo, solicite a amostra adicional ou o trecho de código estritamente necessário.');
   return lines.join('\n');
 }

 const render=(result,series)=>{
   state.result=result;state.selected=series.map(x=>x.key);$('#comparison-panel').classList.remove('is-hidden');$('#analysis-status').textContent='CONCLUÍDA';
   $('#comparison-period').textContent=date(result.rowsStart)+' → '+date(result.rowsEnd)+' · '+result.observations+' observações';
   renderContext(result,series);renderChart(state.rows,series);renderMarkerTimeline();
   const primary=result.series[series[0].key],relations=result.relations;
   let html='<div class="analysis-section-label">1 · DISTRIBUIÇÃO DOS RETORNOS · '+primary.symbol+'</div><p class="analysis-layer-note">Primeiro, entenda o comportamento típico de cada intervalo. Depois, avance para performance, risco e relações.</p><div class="results-grid">'+metric('Média',pct(primary.mean),'por intervalo','Média dos retornos da amostra. Pode ser influenciada por valores extremos.')+metric('Desvio-padrão',pct(primary.std),'por intervalo','Dispersão dos retornos em torno da média; é a medida básica de volatilidade por intervalo.')+metric('Mediana',pct(primary.median),'por intervalo','Retorno central: metade dos retornos fica abaixo e metade acima.')+metric('Melhor intervalo',pct(primary.best),'maior retorno','Maior retorno observado em uma única observação.')+metric('Pior intervalo',pct(primary.worst),'menor retorno','Menor retorno observado em uma única observação.')+metric('Observações',fmt(primary.returns?.filter(Number.isFinite).length,0),'retornos válidos','Quantidade de retornos válidos; normalmente um a menos que o número de preços.')+'</div>'+buildConclusion(result,series)+buildMetricEducation(result,series)+'<div class="analysis-section-label">2 · PERFORMANCE E RISCO</div><div class="results-grid">'+metric('Retorno acumulado',pct(primary.total),'no período','Variação total do preço entre o primeiro e o último valor.')+metric('CAGR',pct(primary.cagr),'anualizado','Taxa composta anual equivalente ao período analisado.')+metric('Volatilidade',pct(primary.vol),'anualizada','Desvio-padrão dos retornos anualizado; difere do desvio-padrão por intervalo acima.')+metric('Drawdown máximo',pct(primary.drawdown),'queda máxima','Maior perda de um pico até um vale no período.')+metric('Sharpe',fmt(primary.sharpe,3),'risco/retorno','Retorno médio ajustado pela volatilidade; esta versão não desconta taxa livre de risco.')+metric('Sortino',fmt(primary.sortino,3),'risco de queda','Relaciona retorno médio à dispersão negativa, conforme a convenção indicada na ajuda.')+metric('Win rate',pct(primary.winRate),'intervalos positivos','Percentual de retornos positivos.')+metric('ATH','$ '+fmt(primary.ath),'máxima observada','Maior preço observado na janela.')+'</div>';
   if(relations.length)html+='<div class="analysis-section-label">RELAÇÕES · ATIVO INVESTIGADO × SÉRIES COMPARADAS</div><div class="results-grid">'+relations.map(r=>metric(r.target.toUpperCase()+' · CORR.',fmt(r.correlation,3),'associação','Correlação dos retornos; não implica causalidade.')+metric(r.target.toUpperCase()+' · BETA',fmt(r.beta,3),'sensibilidade','Sensibilidade do alvo em relação à referência.')+metric(r.target.toUpperCase()+' · R²',pct(r.r2),'ajuste linear','Parcela da variação do alvo explicada pelo modelo linear.')+metric(r.target.toUpperCase()+' · LEAD/LAG',String(r.leadLag.lag),'intervalos','Defasagem com maior correlação absoluta testada.')).join('')+'</div>';
   const validation=result.modelValidation||{status:'NOT_CHECKED',passed:0,total:0,checks:[]};
   const validationLabel=validation.status==='BOTH_PATHS_AGREE'?'AMBOS OS CAMINHOS CONCORDAM':validation.status==='ALERT'?'DIVERGÊNCIA — REVISÃO NECESSÁRIA':'AINDA NÃO VALIDADO';
   const validationColor=validation.status==='BOTH_PATHS_AGREE'?'#4ade80':validation.status==='ALERT'?'#fb7185':'#fbbf24';
   html+='<div class="analysis-validation" role="status" style="margin:16px 0;padding:14px;border:1px solid '+validationColor+';border-radius:12px;background:rgba(15,23,42,.72);color:#e2e8f0"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><strong style="color:'+validationColor+'">'+validationLabel+'</strong><span>'+validation.passed+'/'+validation.total+' verificações numéricas</span></div><p style="margin:8px 0 0;font-size:13px">'+(validation.message||'A conferência numérica ainda não está disponível.')+'</p><details style="margin-top:8px"><summary style="cursor:pointer">Ver verificações</summary><ul style="margin:8px 0 0;padding-left:20px">'+(validation.checks||[]).map(item=>'<li>'+item.status+' · '+item.name+'</li>').join('')+'</ul><small>Concordância entre implementações não equivale a benchmark externo independente. Validade econômica, causalidade e adequação do modelo não estão confirmadas.</small></details></div>';
   html+='<div class="analysis-section-label">AVANÇADO</div><div class="advanced-teaser"><span>Mediana, melhor/pior período, covariância, alpha, correlação móvel e diagnóstico de lead/lag.</span><button id="advanced-analysis">VER ESTATÍSTICAS AVANÇADAS ↗</button></div>';
   const em=result.explanatoryModel;
   if(em?.available){html+='<div class="analysis-section-label">EXPLICAÇÃO MULTIVARIADA · '+primary.symbol+'</div><div class="explanation-teaser"><div><b>PERGUNTA:</b> as variáveis selecionadas ajudam a explicar os retornos do '+primary.symbol+'?</div><strong>R² '+pct(em.r2,2)+' · R² ajustado '+pct(em.adjustedR2,2)+'</strong><small>Modelo linear conjunto sobre retornos alinhados. Associação estatística, não causalidade.</small></div>'}
   else if(series.length>1){html+='<div class="analysis-section-label">EXPLICAÇÃO MULTIVARIADA</div><div class="explanation-teaser is-unavailable"><b>MODELO NÃO ESTIMADO</b><small>'+em.reason+'</small></div>'}
   const diag=result.modelDiagnostics?.heteroskedasticity;
   if(diag?.available){
     const testCards=(diag.tests||[]).map(t=>{
       const color=!t.available?'#fbbf24':t.pValue<0.05?'#fb7185':'#4ade80';
       const status=!t.available?'INCONCLUSIVO':t.pValue<0.05?'SINAL DETECTADO':'SEM SINAL FORTE';
       return '<div style="border:1px solid '+color+';border-radius:10px;padding:10px;min-width:0"><b>'+t.method+'</b><div style="color:'+color+';font-size:12px;margin:5px 0">'+status+'</div><div>LM: '+(Number.isFinite(t.statistic)?fmt(t.statistic,3):'—')+'</div><div>gl: '+(t.df??'—')+' · p: '+(Number.isFinite(t.pValue)?fmt(t.pValue,5):'—')+'</div><small>'+(t.available?'Hipótese nula: '+t.nullHypothesis:t.reason)+'</small></div>';
     }).join('');
     html+='<div class="analysis-section-label">DIAGNÓSTICO DOS RESÍDUOS · VARIÂNCIA</div><p class="analysis-layer-note">p &lt; 0,05 é evidência contra a hipótese nula específica. Um p maior não comprova variância constante.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">'+testCards+'</div><details style="margin:8px 0"><summary style="cursor:pointer">Método e limitações</summary><ul>'+diag.notes.map(note=>'<li>'+note+'</li>').join('')+'</ul></details>';
   }
   $('#analysis-results').innerHTML=html;$('#analysis-results').classList.remove('is-hidden');wireSummaryCopy($('#analysis-results'),{context:$('#analysis-context'),auditText:()=>buildAuditReport(state.result,state.series,state.rows,state.markers)});wireReportButtons($('#analysis-results'),state.result,state.series);$('#full-analysis').classList.remove('is-hidden');$('#advanced-analysis').onclick=()=>openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date});wireMetricHelp($('#analysis-results'));document.querySelector('#show-data-table')?.addEventListener('click',()=>openDataTable({rows:state.rows?.slice(state.markers.start,state.markers.end+1)||[],keys:state.selected||[],assets,fmt,date}));document.querySelector('#show-method')?.addEventListener('click',()=>openInfo('MÉTODO'));
 };

 async function run(){
   const activeSymbol=getActiveSymbol(),reference=document.querySelector('#analysis-reference')?.value||activeSymbol,checked=[...document.querySelectorAll('.analysis-asset:checked')].map(x=>x.value),symbols=[reference,...checked.filter(x=>x!==reference)];
   $('#analysis-status').textContent='ANALISANDO';$('#analysis-results').classList.add('is-hidden');$('#full-analysis').classList.add('is-hidden');$('#comparison-panel').classList.add('is-hidden');$('#analysis-context').classList.add('is-hidden');
   try{const requestedInterval=getInterval()||'1d',hasDailySeries=symbols.some(key=>assets[key]?.supportedIntervals),interval=hasDailySeries?'1d':requestedInterval,period=document.querySelector('#analysis-period')?.value||'full',returnMode=document.querySelector('#analysis-return')?.value||'log',rollingWindow=Number(document.querySelector('#analysis-window')?.value||30),depth=document.querySelector('#analysis-depth')?.value||'key',series=[];for(const key of symbols){const meta=assets[key],sameLoadedAsset=key===activeSymbol&&interval===requestedInterval,loaded=sameLoadedAsset?{candles:getCandles()}:await dataClient.loadOrPopulate({provider:meta.provider,symbol:meta.providerSymbol||key,kind:meta.kind||'ohlcv',interval:meta.supportedIntervals?.includes(interval)?interval:(meta.supportedIntervals?.[0]||interval),currency:'USD'});const candles=normalizeCandles(loaded.candles);if(candles.length<10)throw new Error('Poucos dados para '+meta.symbol+'.');series.push({key,symbol:meta.symbol,name:meta.name,category:meta.category,candles})}let rows=alignSeries(series,interval);if(rows.length<10)throw new Error('Poucos timestamps comuns para esta análise.');if(period!=='full'){const days=Number(period),cutoff=rows.at(-1).timestamp-days*86400000;rows=rows.filter(r=>r.timestamp>=cutoff);if(rows.length<10)throw new Error('O período escolhido não possui observações suficientes para esta análise.')}state.rows=rows;state.series=series;state.markers={start:0,base:0,end:rows.length-1};const calendar=series.some(s=>s.category&&!['crypto','test'].includes(s.category))?'trading':'continuous';const result=analyzeSeries(rows,series,interval,{returnMode,rollingWindow,calendar});
   result.explanatoryModel=runExplanatoryModel(rows,series,{returnMode});
   result.modelDiagnostics=diagnoseModel(result.explanatoryModel);result.modelValidation=validateModelTwoWays(result.explanatoryModel);result.residualValidation=validateResidualDiagnostics(result.explanatoryModel,result.modelDiagnostics);result.periodDays=period;result.rowsStart=rows[0].timestamp;result.rowsEnd=rows.at(-1).timestamp;render(result,series);if(depth==='full')openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date});else if(depth==='advanced')openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date})}catch(error){console.error('[ORACULUM ANALYSIS]',error);$('#analysis-status').textContent='ERRO';$('#analysis-results').innerHTML='<div class="analysis-diagnostics"><p>'+error.message+'</p></div>';$('#analysis-results').classList.remove('is-hidden')}}
 const button=$('#analyze-assets');button?.addEventListener('click',run);$('#full-analysis')?.addEventListener('click',()=>openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date}));
 const onResize=()=>{if(state.rows?.length){const selected=state.selected.map(k=>({...assets[k],key:k})).filter(Boolean);renderChart(state.rows,selected);renderMarkerTimeline()}};window.addEventListener('resize',onResize);return{run,destroy(){window.removeEventListener('resize',onResize)}};
}