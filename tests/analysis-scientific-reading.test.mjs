import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScientificReading} from '../src/analysis/scientific-reading.js';

const fmt=(v)=>Number.isFinite(v)?String(v):'—';
const pct=(v)=>Number.isFinite(v)?(v*100).toFixed(1)+'%':'—';
const date=(v)=>Number.isFinite(v)?new Date(v).toISOString().slice(0,10):'—';

test('contextual reading identifies investigation, beta direction and irregular timing',()=>{
  const html=buildScientificReading({
    interval:'1d',returnMode:'log',rowsStart:Date.UTC(2024,0,1),rowsEnd:Date.UTC(2024,11,31),
    observations:100,temporal:{sharedRows:100,gaps:12},
    series:{btc:{symbol:'BTC'},sol:{symbol:'SOL'}},
    relations:[{primary:'BTC',target:'SOL',correlation:.72,beta:1.3,r2:.52,rolling:.4}],
    explanatoryModel:{available:true,target:'BTC',observations:99,r2:.56,predictors:['SOL']},
    modelDiagnostics:{temporalSpacing:{status:'IRREGULAR_INTERVALS'},heteroskedasticity:{tests:[
      {method:'White',available:true,pValue:.001},{method:'Breusch–Pagan',available:true,pValue:.2}
    ]}}
  },{fmt,pct,date});
  assert.match(html,/LEITURA CIENTÍFICA/);
  assert.match(html,/12 lacunas acima de 1,5 dia/);
  assert.match(html,/série cuja variação é modelada = SOL; a série usada como referência = BTC/);
  assert.match(html,/A magnitude da correlação é forte nesta amostra/);
  assert.match(html,/não um teste de significância nem uma garantia de estabilidade/);
  assert.match(html,/não demonstra causalidade|não demonstram/);
  assert.match(html,/variância não constante/);
  assert.match(html,/espaçamento dos resíduos foi classificado como irregular/);
  assert.match(html,/Próximo passo sugerido/);
  assert.match(html,/compare a correlação móvel em janelas diferentes/);
  assert.match(html,/confira o calendário dos candles/);
  assert.match(html,/id="science-residual-timing"/);
  assert.match(html,/id="science-relation-btc-sol"/);
  assert.match(html,/id="science-residual-diagnostics"/);
});

test('contextual reading explains unavailable models without inventing estimates',()=>{
  const html=buildScientificReading({
    series:{btc:{symbol:'BTC'}},relations:[],explanatoryModel:{available:false,reason:'Amostra insuficiente.'}
  },{fmt,pct,date});
  assert.match(html,/Amostra insuficiente/);
  assert.match(html,/O modelo multivariado não foi estimado/);
  assert.doesNotMatch(html,/R² é <b>56/);
});
