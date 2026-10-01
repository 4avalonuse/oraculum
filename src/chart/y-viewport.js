import{normalizeScaleType,toScaleValue,fromScaleValue,valueAtRatio}from"./scale.js";
const OVERSCROLL_FACTOR=2;
export class YViewport{
 constructor(type="linear"){this.type=normalizeScaleType(type)}
 setType(type){this.type=normalizeScaleType(type);return this}
 validRange(min,max){min=Number(min);max=Number(max);return Number.isFinite(min)&&Number.isFinite(max)&&max>min&&(!this.isLog()||(min>0&&max>0))}
 isLog(){return this.type==="logarithmic"}
 _bounds(bounds){const min=Number(bounds?.min),max=Number(bounds?.max);if(!this.validRange(min,max))return null;const a=toScaleValue(min,this.type),b=toScaleValue(max,this.type),margin=(b-a)*OVERSCROLL_FACTOR;return{min:a-margin,max:b+margin}}
 constrain(range,bounds){const limits=this._bounds(bounds),min=toScaleValue(range?.min,this.type),max=toScaleValue(range?.max,this.type);if(!limits||![min,max].every(Number.isFinite)||!(max>min))return{...range};const limitSpan=limits.max-limits.min,span=max-min;if(span>=limitSpan)return{min:fromScaleValue(limits.min,this.type),max:fromScaleValue(limits.max,this.type)};let a=min,b=max;if(a<limits.min){a=limits.min;b=a+span}if(b>limits.max){b=limits.max;a=b-span}return{min:fromScaleValue(a,this.type),max:fromScaleValue(b,this.type)}}
 pan(range,delta){const min=toScaleValue(range.min,this.type),max=toScaleValue(range.max,this.type),d=Number(delta);if(![min,max,d].every(Number.isFinite)||!(max>min))return{...range};return{min:fromScaleValue(min+d,this.type),max:fromScaleValue(max+d,this.type)}}
 panPixels(range,pixels,height){const min=toScaleValue(range.min,this.type),max=toScaleValue(range.max,this.type),h=Math.max(1,Number(height)||1);if(![min,max].every(Number.isFinite)||!(max>min))return{...range};return this.pan(range,(Number(pixels)/h)*(max-min))}
 zoom(range,factor,anchor){const min=toScaleValue(range.min,this.type),max=toScaleValue(range.max,this.type),a=toScaleValue(anchor,this.type);if(!(Number(factor)>0)||![min,max,a].every(Number.isFinite)||!(max>min))return{...range};return{min:fromScaleValue(a-(a-min)*factor,this.type),max:fromScaleValue(a+(max-a)*factor,this.type)}}
 fit(target){const min=Number(target?.min),max=Number(target?.max);if(!this.validRange(min,max))return{min,max};const a=toScaleValue(min,this.type),b=toScaleValue(max,this.type),pad=(b-a)*.06;return{min:fromScaleValue(a-pad,this.type),max:fromScaleValue(b+pad,this.type)}}
 valueAtRatio(range,ratio){return valueAtRatio(range.min,range.max,ratio,this.type)}
}
