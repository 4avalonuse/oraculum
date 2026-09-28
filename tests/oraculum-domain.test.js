import test from 'node:test';
import assert from 'node:assert/strict';
import {createAsset,createVariable,createObservation,createEvent,createRelation} from '../src/oraculum/domain/index.js';

test('Asset cria identidade mínima',()=>{const asset=createAsset({symbol:'BTC-USD',name:'Bitcoin',currency:'USD'});assert.equal(asset.symbol,'BTC-USD');assert.equal(asset.id,'btc-usd');});
test('Variable exige identidade e nome',()=>{assert.throws(()=>createVariable({name:'CPI'}));assert.throws(()=>createVariable({id:'cpi'}));});
test('Observation normaliza timestamp e valor',()=>{const item=createObservation({variableId:'cpi',timestamp:'1000',value:'3.2'});assert.equal(item.timestamp,1000);assert.equal(item.value,3.2);});
test('Event representa fato temporal independente de variável',()=>{const item=createEvent({id:'fomc-1',timestamp:1000,title:'FOMC',category:'monetary',assetIds:['BTC-USD']});assert.deepEqual(item.assetIds,['BTC-USD']);});
test('Relation exige origem, destino e tipo',()=>{assert.throws(()=>createRelation({id:'r',target:'btc',type:'correlation'}));const item=createRelation({id:'r',source:'cpi',target:'btc',type:'lead-lag',lag:-1});assert.equal(item.lag,-1);});
