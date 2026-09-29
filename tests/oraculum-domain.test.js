import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAsset,
  createVariable,
  createObservation,
  createEvent,
  createRelation,
  createTimeline,
  createFrame,
  createWorkspace
} from '../src/oraculum/domain/index.js';

test('Asset cria identidade mínima',()=>{const asset=createAsset({symbol:'BTC-USD',name:'Bitcoin',currency:'USD'});assert.equal(asset.symbol,'BTC-USD');assert.equal(asset.id,'btc-usd');});
test('Variable exige identidade e nome',()=>{assert.throws(()=>createVariable({name:'CPI'}));assert.throws(()=>createVariable({id:'cpi'}));});
test('Observation normaliza timestamp e valor',()=>{const item=createObservation({variableId:'cpi',timestamp:'1000',value:'3.2'});assert.equal(item.timestamp,1000);assert.equal(item.value,3.2);});
test('Event representa fato temporal independente de variável',()=>{const item=createEvent({id:'fomc-1',timestamp:1000,title:'FOMC',category:'monetary',assetIds:['BTC-USD']});assert.deepEqual(item.assetIds,['BTC-USD']);});
test('Relation exige origem, destino e tipo',()=>{assert.throws(()=>createRelation({id:'r',target:'btc',type:'correlation'}));const item=createRelation({id:'r',source:'cpi',target:'btc',type:'lead-lag',lag:-1});assert.equal(item.lag,-1);});
test('Timeline organiza objetos no tempo',()=>{const timeline=createTimeline({id:'btc-context',assetIds:['btc-usd'],items:[{id:'e1',type:'event',timestamp:'2000'}]});assert.equal(timeline.items[0].timestamp,2000);assert.deepEqual(timeline.assetIds,['btc-usd']);});
test('Frame representa uma unidade visual ou analítica',()=>{const frame=createFrame({id:'price',type:'chart',start:'1000',end:'2000',sourceIds:['btc-usd']});assert.equal(frame.type,'chart');assert.equal(frame.start,1000);});
test('Workspace organiza frames e contexto sem conhecer UI',()=>{const workspace=createWorkspace({id:'btc-study',name:'BTC Study',assetIds:['btc-usd'],frameIds:['price'],timelineIds:['btc-context']});assert.deepEqual(workspace.frameIds,['price']);assert.deepEqual(workspace.timelineIds,['btc-context']);});


import {createNavigationState} from '../src/oraculum/application/navigation/navigation-state.js';

test('NavigationState aceita apenas rotas conhecidas',()=>{
  const navigation=createNavigationState('dados',['visao','dados','timeline','workspace']);
  assert.equal(navigation.get(),'dados');
  assert.equal(navigation.set('timeline'),'timeline');
  assert.equal(navigation.set('inexistente'),'timeline');
  assert.equal(navigation.get(),'timeline');
});
