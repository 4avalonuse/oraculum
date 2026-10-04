/* ORACULUM — análise sob demanda de múltiplas séries */
import {analyzeSeries,alignSeries} from './engine.js';

function fmt(v,d=2){if(!Number.isFinite(v))return '—';return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:d}).format(v)}
function pct(v,d=2){return Number.isFinite(v)?fmt(v*100,d)+'%':'—'}
function metric(label,value,note=''){return '<div class="analysis-metric"><span>'+label+'</span><strong>'+value+'</strong>'+(note?'<small>'+note+'</small>':'')+'</div>'}

export function attachComparisonAnalysis({dataClient,normalizeCandles,getCandles,getInterval,getActiveSymbol,assets}){
 const $=s=>document.querySelector(s),state={rows:null,result:null,selected:[]};
 const renderChart=(rows,series)=>{
   const host=$('#comparison-chart');if(!host||!rows.length)return;
   const w=Math.max(320,host.clientWidth||800),h=260,p={l:42,r:14,t:14,b:24};
   const normalized=series.map(s=>rows.map(r=>100*r[s.key]/rows[0][s.key]));
   const all=normalized.flat(),lo=Math.log(Math.min(...all)),hi=Math.log(Math.max(...all));
   const line=vals=>vals.map((v,i)=>{const x=p.l+i*(w-p.l-p.r)/Math.max(1,vals.length-1),y=h-p.b-(Math.log(Math.max(.0001,v))-lo)/(hi-lo||1)*(h-p.t-p.b);return x.toFixed(2)+','+y.toFixed(2)}).join(' ');
   const polylines=normalized.map((v,i)=>'<polyline points="'+line(v)+'" class="cmp-line cmp-'+i+'"/>').join('');
   host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img"><line x1="'+p.l+'" x2="'+p.l+'" y1="'+p.t+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h-p.b)+'" y2="'+(h-p.b)+'" class="cmp-axis"/>'+polylines+'<text x="'+p.l+'" y="'+(h-6)+'">início</text><text x="'+(w-p.r)+'" y="'+(h-6)+'" text-anchor="end">agora</text></svg>';
   const legend=$('#comparison-legend');if(legend)legend.innerHTML=series.map((s,i)=>'<span><i class="legend-'+i+'"></i>'+s.symbol+'</span>').join('');
 };
 const render=(result,series)=>{
   state.result=result;state.selected=series.map(x=>x.key);
   $('#analysis-status').textContent='CONCLUÍDA';
   $('#comparison-period').textContent=new Date(result.rowsStart).toLocaleDateString('pt-BR')+' → '+new Date(result.rowsEnd).toLocaleDateString('pt-BR')+' · '+result.observations+' observações';
   renderChart(state.rows,series);
   const primary=result.series[series[0].key];
   const relations=result.relations;
   let html='<div class="analysis-section-label">RESUMO · '+primary.symbol+' COMO REFERÊNCIA</div><div class="results-grid">'+metric('Retorno',pct(primary.total))+metric('CAGR',pct(primary.cagr))+metric('Volatilidade',pct(primary.vol),'anualizada')+metric('Drawdown',pct(primary.drawdown))+metric('Sharpe',fmt(primary.sharpe,3))+metric('Sortino',fmt(primary.sortino,3))+metric('Win rate',pct(primary.winRate))+metric('ATH','$ '+fmt(primary.ath))+ '</div>';
   if(relations.length)html+='<div class="analysis-section-label">RELAÇÕES</div><div class="results-grid">'+relations.map(r=>metric(r.target.toUpperCase()+' · CORR.',fmt(r.correlation,3)) + metric(r.target.toUpperCase()+' · BETA',fmt(r.beta,3)) + metric(r.target.toUpperCase()+' · R²',pct(r.r2)) + metric(r.target.toUpperCase()+' · LEAD/LAG',String(r.leadLag.lag))).join('')+'</div>';
   const el=$('#analysis-results');el.innerHTML=html;el.classList.remove('is-hidden');$('#full-analysis').classList.remove('is-hidden');
 };
 async function run(){
   const activeSymbol=getActiveSymbol(),checked=[...document.querySelectorAll('.analysis-asset:checked')].map(x=>x.value),symbols=[activeSymbol,...checked.filter(x=>x!==activeSymbol)];
   $('#analysis-status').textContent='ANALISANDO';$('#analysis-results').classList.add('is-hidden');$('#full-analysis').classList.add('is-hidden');
   try{
     const interval=getInterval()||'1d';
     const series=[];
     for(const key of symbols){const meta=assets[key];const loaded=key===activeSymbol?{candles:getCandles()}:await dataClient.loadOrPopulate({provider:meta.provider,symbol:key,kind:'ohlcv',interval,currency:'USD'});const candles=normalizeCandles(loaded.candles);if(candles.length<10)throw new Error('Poucos dados para '+meta.symbol+'.');series.push({key,symbol:meta.symbol,name:meta.name,candles})}
     const rows=alignSeries(series);if(rows.length<10)throw new Error('Poucos timestamps comuns para esta análise.');
     state.rows=rows;
     const result=analyzeSeries(rows,series,interval);result.rowsStart=rows[0].timestamp;result.rowsEnd=rows.at(-1).timestamp;
     render(result,series);
   }catch(error){console.error('[ORACULUM ANALYSIS]',error);$('#analysis-status').textContent='ERRO';$('#analysis-results').innerHTML='<div class="analysis-diagnostics"><p>'+error.message+'</p></div>';$('#analysis-results').classList.remove('is-hidden')}
 }
 const button=$('#analyze-assets');
 button?.addEventListener('click',run);
 $('#full-analysis')?.addEventListener('click',()=>{
   const r=state.result;if(!r)return;
   const modal=document.createElement('div');modal.className='analysis-modal';
   const rows=Object.values(r.series).map(s=>'<tr><td>'+s.symbol+'</td><td>'+pct(s.total)+'</td><td>'+pct(s.cagr)+'</td><td>'+pct(s.vol)+'</td><td>'+pct(s.drawdown)+'</td><td>'+fmt(s.sharpe,3)+'</td><td>'+pct(s.winRate)+'</td></tr>').join('');
   const rel=r.relations.map(x=>'<tr><td>'+x.primary.toUpperCase()+'</td><td>'+x.target.toUpperCase()+'</td><td>'+fmt(x.correlation,4)+'</td><td>'+fmt(x.beta,4)+'</td><td>'+pct(x.r2)+'</td><td>'+x.leadLag.lag+'</td></tr>').join('');
   modal.innerHTML='<div class="analysis-modal-backdrop"></div><section class="analysis-modal-panel" role="dialog" aria-modal="true"><header><div><strong>ANÁLISE COMPLETA</strong><small>'+r.observations+' observações alinhadas · '+r.interval+'</small></div><button class="analysis-close" aria-label="Fechar">×</button></header><div class="analysis-modal-body"><section><h3>PERFORMANCE E RISCO</h3><table><thead><tr><th>Ativo</th><th>Retorno</th><th>CAGR</th><th>Vol.</th><th>DD</th><th>Sharpe</th><th>Win rate</th></tr></thead><tbody>'+rows+'</tbody></table></section><section><h3>RELAÇÕES ESTATÍSTICAS</h3><table><thead><tr><th>Ref.</th><th>Alvo</th><th>Corr.</th><th>Beta</th><th>R²</th><th>Lead/Lag</th></tr></thead><tbody>'+rel+'</tbody></table></section><section><h3>DIAGNÓSTICOS</h3><div class="analysis-diagnostics"><p><b>Janela:</b> '+new Date(r.rowsStart).toLocaleDateString('pt-BR')+' → '+new Date(r.rowsEnd).toLocaleDateString('pt-BR')+'.</p><p><b>Normalização:</b> comparação visual em base 100 e escala log.</p><p><b>Retornos:</b> log-retornos; volatilidade, Sharpe e Sortino anualizados conforme o intervalo.</p><p><b>Interpretação:</b> correlação, beta e lead/lag indicam associação estatística, não causalidade.</p></div></section></div></section>';
   const close=()=>modal.remove();modal.querySelector('.analysis-close').onclick=close;modal.querySelector('.analysis-modal-backdrop').onclick=close;document.body.appendChild(modal);
 });
 const onResize=()=>{if(state.rows?.length){const selected=state.selected.map(k=>assets[k]).filter(Boolean);renderChart(state.rows,selected)}};
 window.addEventListener('resize',onResize);
 return {run,destroy(){window.removeEventListener('resize',onResize)}};
}
