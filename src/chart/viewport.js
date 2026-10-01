import{panTime,zoomTime,fitTime,expandTimeBounds}from"./time-scale.js";
import{normalizeScaleType}from"./scale.js";
import{YViewport}from"./y-viewport.js";
function validRange(r){return Number.isFinite(r?.min)&&Number.isFinite(r?.max)&&r.max>r.min}
export function createViewport(){
 const bounds={x:{min:0,max:1},y:{min:0,max:1}};let range={x:{min:0,max:1},y:{min:0,max:1}};const yViewport=new YViewport("linear");
 return{
  setDataBounds(next){bounds.x={...next.x};bounds.y={...next.y};range={x:{...bounds.x},y:{...bounds.y}};if(yViewport.isLog()&&(bounds.y.min<=0||bounds.y.max<=0))yViewport.setType("linear")},
  getBounds(){return{x:{...bounds.x},y:{...bounds.y}}},
  getState(){return{x:{...range.x},y:{...range.y},yScaleType:yViewport.type}},
  setState(next){const x={min:Number(next?.x?.min),max:Number(next?.x?.max)},y={min:Number(next?.y?.min),max:Number(next?.y?.max)};if(!validRange(x)||!validRange(y))return false;const type=next?.yScaleType?normalizeScaleType(next.yScaleType):yViewport.type;if(type==="logarithmic"&&(bounds.y.min<=0||bounds.y.max<=0))return false;yViewport.setType(type);range={x:panTime(x,0,expandTimeBounds(bounds.x)),y:yViewport.constrain(y,bounds.y)};return true},
  getYScaleType(){return yViewport.type},
  setYScaleType(type){const next=normalizeScaleType(type);if(next==="logarithmic"&&(bounds.y.min<=0||bounds.y.max<=0))return false;yViewport.setType(next);range.y=yViewport.constrain(range.y,bounds.y);return true},
  panX(delta){range.x=panTime(range.x,delta,expandTimeBounds(bounds.x))},
  zoomX(factor,anchor){range.x=zoomTime(range.x,factor,anchor,bounds.x)},
  panY(delta){range.y=yViewport.constrain(yViewport.pan(range.y,delta),bounds.y)},
  panYByPixels(pixels,height){range.y=yViewport.constrain(yViewport.panPixels(range.y,pixels,height),bounds.y)},
  zoomY(factor,anchor){range.y=yViewport.constrain(yViewport.zoom(range.y,factor,anchor),bounds.y)},
  fitX(target){range.x=fitTime(target,bounds.x)},
  fitY(target){range.y=yViewport.constrain(yViewport.fit(target),bounds.y)},
  fitAll(){range={x:{...bounds.x},y:{...bounds.y}}},
  priceAtYRatio(ratio){return yViewport.valueAtRatio(range.y,ratio)}
 }
}