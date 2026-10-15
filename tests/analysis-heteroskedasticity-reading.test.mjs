import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHeteroskedasticityReading } from '../src/analysis/heteroskedasticity-reading.js';

const fmt=(v,d=3)=>Number.isFinite(v)?v.toFixed(d):'—';

test('variance reading explains distinct null hypotheses and flags evidence without claiming causality',()=>{
  const html=buildHeteroskedasticityReading({heteroskedasticity:{available:true,alpha:.05,tests:[
    {method:'Breusch–Pagan',available:true,statistic:8.418,df:1,pValue:.00372,n:1244,nullHypothesis:'Null BP',formula:'LM = n × R²'},
    {method:'White',available:true,statistic:198.06,df:2,pValue:0,n:1244,nullHypothesis:'Null White',formula:'LM White'},
    {method:'ARCH-LM',available:true,statistic:22.093,df:5,lag:5,pValue:.0005,n:1239,nullHypothesis:'Null ARCH',formula:'LM ARCH'}
  ],notes:['p-values são assintóticos.']}},{fmt});
  assert.match(html,/3 de 3 testes disponíveis/);
  assert.match(html,/SINAL DETECTADO/);
  assert.match(html,/≈ 0 na precisão numérica do cálculo/);
  assert.match(html,/dependência temporal/);
  assert.match(html,/não escolhe automaticamente um modelo ARCH\/GARCH/);
  assert.match(html,/não corrigem especificação errada/);
  assert.match(html,/p-values são assintóticos/);
});

test('variance reading does not call non-rejection proof of constant variance',()=>{
  const html=buildHeteroskedasticityReading({heteroskedasticity:{available:true,alpha:.05,tests:[
    {method:'Breusch–Pagan',available:true,statistic:1.2,df:1,pValue:.27,n:100},
    {method:'White',available:false,reason:'Regressão auxiliar singular.'}
  ]}},{fmt});
  assert.match(html,/não rejeita sua hipótese nula/);
  assert.match(html,/não prova que a variância seja constante/);
  assert.match(html,/INCONCLUSIVO/);
  assert.match(html,/Regressão auxiliar singular/);
});
