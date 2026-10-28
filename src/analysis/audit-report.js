/* Relatório de auditoria estatística: formatação e exportação, sem dependência da interface. */
function auditNumber(value,digits=8){
   if(value===null||value===undefined||!Number.isFinite(Number(value)))return 'indefinido';
   const n=Number(value);
   if(n!==0&&Math.abs(n)<1e-7)return n.toExponential(3);
   return n.toLocaleString('pt-BR',{maximumFractionDigits:digits});
 }
 function auditPct(value){return Number.isFinite(value)?auditNumber(value*100,6)+'%':'indefinido'}
 function auditDate(value){return Number.isFinite(Number(value))?new Date(Number(value)).toISOString().slice(0,10):'indefinida'}
 function auditTimestamp(value){return Number.isFinite(Number(value))?new Date(Number(value)).toISOString():'indefinido'}
export function buildAuditReport(result,series,rows,markers,timelineContext={}){
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
     'Período principal: '+auditDate(result.rowsStart)+' a '+auditDate(result.rowsEnd),
     'Janelas selecionadas: '+series.map(x=>x.symbol+' '+auditDate(x.window?.start)+' a '+auditDate(x.window?.end)+' ('+(timelineContext.timelineRows[x.key]?.length??0)+' preços)').join(' | '),
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
   if(timelineContext.timelineSlots?.length){
     lines.push('Amostras curtas por janela individual; janelas deslocadas não são pareadas artificialmente.');
     for(const s of series){
       const rows=timelineContext.timelineRows[s.key]||[];
       if(!rows.length){lines.push(s.symbol+': janela sem dados.');continue}
       const indices=[...new Set([0,1,2,Math.floor((rows.length-1)/2),rows.length-3,rows.length-2,rows.length-1])].filter(i=>i>=0&&i<rows.length).sort((a,b)=>a-b);
       lines.push('',s.symbol+' | '+auditDate(rows[0].timestamp)+' a '+auditDate(rows.at(-1).timestamp)+' | '+rows.length+' preços');
       lines.push('Data | preço | timestamp-fonte UTC');
       for(const i of indices)lines.push(auditDate(rows[i].timestamp)+' | '+auditNumber(rows[i][s.key],8)+' | '+auditTimestamp(rows[i].__sourceTimestamps?.[s.key]??rows[i].timestamp));
     }
   }else if(sampleRows.length){
     const indices=[...new Set([0,1,2,Math.floor((sampleRows.length-1)/2)-1,Math.floor((sampleRows.length-1)/2),Math.floor((sampleRows.length-1)/2)+1,sampleRows.length-3,sampleRows.length-2,sampleRows.length-1])].filter(i=>i>=0&&i<sampleRows.length).sort((a,b)=>a-b);
     lines.push('Amostra curta de preços alinhados; serve para inspeção pontual, não para recalcular sozinha toda a regressão.');
     lines.push('Data do bucket | '+series.map(s=>s.symbol+' preço @ timestamp-fonte UTC').join(' | '));
     for(const i of indices)lines.push(auditDate(sampleRows[i].timestamp)+' | '+series.map(s=>auditNumber(sampleRows[i][s.key],8)+' @ '+auditTimestamp(sampleRows[i].__sourceTimestamps?.[s.key])).join(' | '));
   }else lines.push('Trechos de preços não disponíveis nesta exportação.');
   lines.push('','Se um cálculo não puder ser validado com este resumo, solicite a amostra adicional ou o trecho de código estritamente necessário.');
   return lines.join('\n');
 }

