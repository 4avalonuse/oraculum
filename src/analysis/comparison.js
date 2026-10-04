/* ORACULUM — análise comparativa BTC/SOL */

function analysisMean(values){return values.reduce((a,b)=>a+b,0)/Math.max(1,values.length)}
function analysisMedian(values){const v=[...values].sort((a,b)=>a-b),m=Math.floor(v.length/2);return v.length?(v.length%2?v[m]:(v[m-1]+v[m])/2):NaN}
function analysisStd(values){if(values.length<2)return 0;const m=analysisMean(values);return Math.sqrt(values.reduce((s,v)=>s+(v-m)**2,0)/(values.length-1))}
function analysisCov(a,b){if(a.length<2)return 0;const ma=analysisMean(a),mb=analysisMean(b);return a.reduce((s,v,i)=>s+(v-ma)*(b[i]-mb),0)/(a.length-1)}
function analysisCorr(a,b){const sa=analysisStd(a),sb=analysisStd(b);return sa&&sb?analysisCov(a,b)/(sa*sb):0}
function analysisFmt(v,d=2){if(!Number.isFinite(v))return '—';return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:d}).format(v)}
function analysisPct(v,d=2){return Number.isFinite(v)?analysisFmt(v*100,d)+'%':'—'}
function analysisAlign(btc,sol){const smap=new Map(sol.map(x=>[Number(x.timestamp),x]));return btc.map(x=>{const y=smap.get(Number(x.timestamp));return y&&Number.isFinite(x.close)&&Number.isFinite(y.close)?{timestamp:Number(x.timestamp),btc:x.close,sol:y.close}:null}).filter(Boolean)}
function analysisReturns(rows,key){const out=[];for(let i=1;i<rows.length;i++){const a=rows[i-1][key],b=rows[i][key];if(a>0&&b>0)out.push(Math.log(b/a))}return out}
function analysisDrawdown(rows,key){let peak=rows[0]?.[key]||0,min=0;for(const r of rows){peak=Math.max(peak,r[key]);min=Math.min(min,r[key]/peak-1)}return min}
function analysisLeadLag(a,b,maxLag=5){const out=[];for(let lag=-maxLag;lag<=maxLag;lag++){const x=[],y=[];for(let i=0;i<a.length;i++){const j=i+lag;if(j>=0&&j<b.length){x.push(a[i]);y.push(b[j])}}out.push({lag,corr:analysisCorr(x,y)})}return out}
function analysisRegression(x,y){const mx=analysisMean(x),my=analysisMean(y),cov=analysisCov(x,y),vx=analysisCov(x,x),beta=vx?cov/vx:0,alpha=my-beta*mx,r=analysisCorr(x,y);return {alpha,beta,r,r2:r*r}}
function analysisMetric(label,value,note=''){return '<div class="analysis-metric"><span>'+label+'</span><strong>'+value+'</strong>'+(note?'<small>'+note+'</small>':'')+'</div>'}

export function attachComparisonAnalysis({dataClient,normalizeCandles,getCandles,getInterval}){
 const $=s=>document.querySelector(s);
 const state={btc:null,sol:null,rows:null,metrics:null};

 function renderComparison(rows){
  const host=$('#comparison-chart');if(!host||!rows.length)return;
  const w=Math.max(320,host.clientWidth||800),h=260,p={l:42,r:14,t:14,b:24};
  const base=rows[0],btcVals=rows.map(r=>100*r.btc/base.btc),solVals=rows.map(r=>100*r.sol/base.sol);
  const lo=Math.log(Math.min(...btcVals,...solVals)),hi=Math.log(Math.max(...btcVals,...solVals));
  const line=vals=>vals.map((v,i)=>{const x=p.l+i*(w-p.l-p.r)/Math.max(1,vals.length-1),y=h-p.b-(Math.log(Math.max(.0001,v))-lo)/(hi-lo||1)*(h-p.t-p.b);return x.toFixed(2)+','+y.toFixed(2)}).join(' ');
  const ticks=[0,.5,1].map(t=>{const v=Math.exp(lo+(hi-lo)*t);return '<text x="'+(p.l-6)+'" y="'+(h-p.b-t*(h-p.t-p.b)+3)+'" text-anchor="end">'+analysisFmt(v,0)+'</text>'}).join('');
  host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img"><line x1="'+p.l+'" x2="'+p.l+'" y1="'+p.t+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h-p.b)+'" y2="'+(h-p.b)+'" class="cmp-axis"/><polyline points="'+line(btcVals)+'" class="cmp-btc"/><polyline points="'+line(solVals)+'" class="cmp-sol"/><g class="cmp-labels">'+ticks+'</g><text x="'+p.l+'" y="'+(h-6)+'">início</text><text x="'+(w-p.r)+'" y="'+(h-6)+'" text-anchor="end">agora</text></svg>';
 }
 function calculateAnalysis(rows){
  const rb=analysisReturns(rows,'btc'),rs=analysisReturns(rows,'sol'),n=Math.min(rb.length,rs.length),b=rb.slice(-n),s=rs.slice(-n),reg=analysisRegression(b,s),corr=analysisCorr(b,s),volB=analysisStd(b)*Math.sqrt(365),volS=analysisStd(s)*Math.sqrt(365),lag=analysisLeadLag(b,s,5).sort((x,y)=>Math.abs(y.corr)-Math.abs(x.corr))[0],totalB=rows.at(-1).btc/rows[0].btc-1,totalS=rows.at(-1).sol/rows[0].sol-1;
  return {n,correlation:corr,covariance:analysisCov(b,s),beta:reg.beta,alpha:reg.alpha,r2:reg.r2,volB,volS,totalB,totalS,drawB:analysisDrawdown(rows,'btc'),drawS:analysisDrawdown(rows,'sol'),autoB:analysisCorr(b.slice(1),b.slice(0,-1)),autoS:analysisCorr(s.slice(1),s.slice(0,-1)),leadLag:lag,meanB:analysisMean(b),meanS:analysisMean(s),medianB:analysisMedian(b),medianS:analysisMedian(s)};
 }
 function renderAnalysis(rows){
  const m=calculateAnalysis(rows);state.metrics=m;
  $('#analysis-status').textContent='PRONTO';
  $('#comparison-period').textContent=new Date(rows[0].timestamp).toLocaleDateString('pt-BR')+' → '+new Date(rows.at(-1).timestamp).toLocaleDateString('pt-BR')+' · '+m.n+' retornos';
  renderComparison(rows);
  const el=$('#analysis-results');
  el.innerHTML='<div class="results-grid">'+analysisMetric('Correlação',analysisFmt(m.correlation,3),'retornos log')+analysisMetric('Beta SOL → BTC',analysisFmt(m.beta,3),'regressão SOL sobre BTC')+analysisMetric('R²',analysisPct(m.r2),'variância explicada na regressão')+analysisMetric('Volatilidade BTC',analysisPct(m.volB),'anualizada · 365 dias')+analysisMetric('Volatilidade SOL',analysisPct(m.volS),'anualizada · 365 dias')+analysisMetric('Retorno BTC',analysisPct(m.totalB))+analysisMetric('Retorno SOL',analysisPct(m.totalS))+analysisMetric('Lead/Lag',String(m.leadLag.lag),'máx. correlação em ±5 períodos')+'</div>';
  el.classList.remove('is-hidden');$('#full-analysis').classList.remove('is-hidden');
 }
 function buildFullAnalysis(){
  const m=state.metrics,r=state.rows;
  if(!m||!r?.length)return;
  const lagRows=analysisLeadLag(analysisReturns(r,'btc'),analysisReturns(r,'sol'),5).map(x=>'<tr><td>'+x.lag+'</td><td>'+analysisFmt(x.corr,4)+'</td></tr>').join('');
  const modal=document.createElement('div');modal.className='analysis-modal';modal.innerHTML='<div class="analysis-modal-backdrop"></div><section class="analysis-modal-panel" role="dialog" aria-modal="true"><header><div><strong>ANÁLISE COMPLETA · BTC × SOL</strong><small>'+r.length+' observações alinhadas · retornos log · '+new Date(r[0].timestamp).toLocaleDateString('pt-BR')+' → '+new Date(r.at(-1).timestamp).toLocaleDateString('pt-BR')+'</small></div><button class="analysis-close" aria-label="Fechar">×</button></header><div class="analysis-modal-body"><section><h3>Resumo estatístico</h3><div class="results-grid">'+analysisMetric('Observações',String(m.n))+analysisMetric('Correlação',analysisFmt(m.correlation,5))+analysisMetric('Covariância',analysisFmt(m.covariance,6))+analysisMetric('Beta',analysisFmt(m.beta,5))+analysisMetric('Alpha',analysisFmt(m.alpha,6))+analysisMetric('R²',analysisPct(m.r2))+analysisMetric('Média BTC',analysisPct(m.meanB))+analysisMetric('Média SOL',analysisPct(m.meanS))+analysisMetric('Mediana BTC',analysisPct(m.medianB))+analysisMetric('Mediana SOL',analysisPct(m.medianS))+analysisMetric('Vol. BTC',analysisPct(m.volB))+analysisMetric('Vol. SOL',analysisPct(m.volS))+analysisMetric('Drawdown BTC',analysisPct(m.drawB))+analysisMetric('Drawdown SOL',analysisPct(m.drawS))+analysisMetric('Autocorr. BTC',analysisFmt(m.autoB,4),'lag 1')+analysisMetric('Autocorr. SOL',analysisFmt(m.autoS,4),'lag 1')+'</div></section><section><h3>Regressão e lead / lag</h3><p class="analysis-note">Modelo atual: retorno SOL = α + β × retorno BTC + ε. O coeficiente e o R² são calculados sobre retornos log alinhados.</p><table><thead><tr><th>Lag</th><th>Correlação</th></tr></thead><tbody>'+lagRows+'</tbody></table></section><section><h3>Diagnósticos</h3><div class="analysis-diagnostics"><p><b>Qualidade da amostra:</b> '+r.length+' timestamps comuns entre BTC e SOL.</p><p><b>Normalização:</b> ambas as séries começam em 100 para comparação relativa; o gráfico usa escala log.</p><p><b>Interpretação:</b> correlação e regressão descrevem associação estatística; não estabelecem causalidade.</p><p><b>Próxima camada:</b> testes de estacionariedade, cointegração, VAR, resíduos e modelos multivariados entram como módulos econométricos específicos, sem fabricar resultados quando o teste ainda não foi executado.</p></div></section></div></section>';
  const close=()=>modal.remove();modal.querySelector('.analysis-close').onclick=close;modal.querySelector('.analysis-modal-backdrop').onclick=close;document.body.appendChild(modal);
 }
 $('#sol-select')?.addEventListener('change',async e=>{
  const panel=$('#comparison-panel'),status=$('#analysis-status');
  if(!e.target.checked){panel.classList.add('is-hidden');$('#analysis-results').classList.add('is-hidden');$('#full-analysis').classList.add('is-hidden');status.textContent='AGUARDANDO';return}
  status.textContent='CALCULANDO';
  try{
   const interval=getInterval()||'1d';
   const loaded=await dataClient.loadOrPopulate({provider:'yahoo',symbol:'SOL-USD',kind:'ohlcv',interval:interval,currency:'USD'});
   const sol=normalizeCandles(loaded.candles),btc=getCandles()||[],rows=analysisAlign(btc,sol);
   if(rows.length<10)throw new Error('Poucos timestamps comuns para comparar BTC e SOL.');
   state.btc=btc;state.sol=sol;state.rows=rows;panel.classList.remove('is-hidden');renderAnalysis(rows);
  }catch(error){console.error('[ORACULUM ANALYSIS]',error);status.textContent='ERRO';panel.classList.add('is-hidden')}
 });
 $('#full-analysis')?.addEventListener('click',buildFullAnalysis);
 const onResize=()=>{if(state.rows?.length)renderComparison(state.rows)};
 window.addEventListener('resize',onResize);
 return {getState:()=>({...state}),destroy(){window.removeEventListener('resize',onResize)}};
}
