import test from 'node:test';
import assert from 'node:assert/strict';
import {buildConclusion,buildMetricEducation,buildTechnicalReport,buildScientificReport} from '../src/analysis/interpretation.js';

const sample={
  interval:'1d',returnMode:'log',rowsStart:Date.UTC(2024,0,1),rowsEnd:Date.UTC(2025,0,1),observations:250,rollingWindow:30,
  series:{btc:{symbol:'BTC',total:.42,cagr:.31,vol:.68,drawdown:-.27,sharpe:1.1,var95:.045,es95:.07}},
  relations:[{primary:'BTC',target:'SOL',correlation:.56,beta:1.16,r2:.31,rolling:.82}],
  explanatoryModel:{available:true,target:'BTC',predictors:['SOL'],observations:249,r2:.31,adjustedR2:.30,coefficients:[{name:'SOL',beta:.2,se:.03,p:.01}],hacCoefficients:[{name:'SOL',beta:.2,hacSe:.04,hacP:.02}]},
  modelDiagnostics:{heteroskedasticity:{alpha:.05,tests:[{method:'White',available:true,statistic:12,df:2,pValue:.001}] }},
  modelValidation:{status:'BOTH_PATHS_AGREE',passed:6,total:6}
};
const series=[{key:'btc',symbol:'BTC'}];

test('conclusion is contextual and avoids universal good/bad or causal claims',()=>{
  const html=buildConclusion(sample,series);
  assert.match(html,/Conclusão desta investigação/);
  assert.match(html,/42/);
  assert.match(html,/não prova causa|não garante|não significa/);
  assert.match(html,/os caminhos de cálculo avaliados concordaram/);
  assert.match(html,/Conferência numérica:/);
  assert.doesNotMatch(html,/A volatilidade anualizada estimada foi/);
  assert.ok((html.match(/<li>/g)||[]).length<=5,'conclusion should stay focused on at most five findings');
});
test('indicator guide explains limits and provides mini drawings',()=>{
  const html=buildMetricEducation(sample,series);
  assert.match(html,/Volatilidade/);
  assert.match(html,/Correlação/);
  assert.match(html,/não garante proteção/);
  assert.match(html,/<svg/);
  assert.match(html,/VaR e ES/);
});
test('both report types contain sample, model caveats and different interpretations',()=>{
  const technical=buildTechnicalReport(sample,series);
  const scientific=buildScientificReport(sample,series);
  assert.match(technical,/AUDITORIA SOLICITADA/);
  assert.match(technical,/White/);
  assert.match(scientific,/CONCLUSÃO EM LINGUAGEM SIMPLES/);
  assert.match(scientific,/não prova causalidade/);
});
