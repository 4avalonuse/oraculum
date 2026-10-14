import test from 'node:test';
import assert from 'node:assert/strict';
import {studentTPValue,studentTCritical,normalTwoSidedP,fUpperTailP} from '../src/analysis/distributions.js';

const close=(actual,expected,tolerance=1e-7)=>assert.ok(Math.abs(actual-expected)<=tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);

test('Student t two-sided p-value matches fixed reference value',()=>close(studentTPValue(2,10),0.07338803477074039,2e-10));
test('Student t critical value matches fixed 95% reference',()=>close(studentTCritical(0.05,10),2.2281388519649385,2e-8));
test('two-sided normal p-value is calibrated at the 5% threshold',()=>close(normalTwoSidedP(1.959963984540054),0.05,2e-12));
test('F upper-tail p-value matches fixed reference value',()=>close(fUpperTailP(4.964602743730714,1,10),0.05,2e-7));
test('normal p-value handles zero and extreme statistics',()=>{\n close(normalTwoSidedP(0),1,1e-14);\n close(normalTwoSidedP(8),1.2441921148543639e-15,2e-25);\n});\ntest('invalid degrees of freedom and non-finite statistics are not assigned p-values',()=>{
 assert.ok(Number.isNaN(studentTPValue(1,0)));
 assert.ok(Number.isNaN(studentTPValue(Infinity,10)));
 assert.ok(Number.isNaN(studentTCritical(0.05,0)));
 assert.ok(Number.isNaN(studentTCritical(0,10)));
 assert.ok(Number.isNaN(fUpperTailP(1,0,10)));
});
