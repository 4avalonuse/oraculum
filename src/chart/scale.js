export function normalizeScaleType(type){return type==="logarithmic"?"logarithmic":"linear"}
export function toScaleValue(value,type){const n=Number(value);return type==="logarithmic"?Math.log(Math.max(n,.000001)):n}
export function fromScaleValue(value,type){return type==="logarithmic"?Math.exp(value):value}
export function valueAtRatio(min,max,ratio,type){const a=toScaleValue(min,type),b=toScaleValue(max,type),q=Math.max(0,Math.min(1,Number(ratio)||0));return fromScaleValue(b-(b-a)*q,type)}
