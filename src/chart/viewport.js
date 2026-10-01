function validRange(r){return Number.isFinite(r?.min)&&Number.isFinite(r?.max)&&r.max>r.min}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
export function createViewport(){
  let bounds={x:{min:0,max:1},y:{min:0,max:1}},range={x:{min:0,max:1},y:{min:0,max:1}},scale="linear";
  const cx=r=>{const b=bounds.x,span=r.max-r.min,full=b.max-b.min;if(span>=full)return {...b};let min=clamp(r.min,b.min,b.max-span),max=min+span;if(max>b.max){max=b.max;min=max-span}return{min,max}};
  const cy=r=>{const b=bounds.y,span=r.max-r.min,full=b.max-b.min;if(span>=full)return {...b};let min=clamp(r.min,b.min,b.max-span),max=min+span;if(max>b.max){max=b.max;min=max-span}return{min,max}};
  return {
    setDataBounds(b){bounds={x:{...b.x},y:{...b.y}};range={x:{...b.x},y:{...b.y}};if(scale==="logarithmic"&&b.y.min<=0)scale="linear"},
    getBounds(){return {x:{...bounds.x},y:{...bounds.y}}},
    getState(){return{x:{...range.x},y:{...range.y},yScaleType:scale}},
    setState(s){const x={min:Number(s?.x?.min),max:Number(s?.x?.max)},y={min:Number(s?.y?.min),max:Number(s?.y?.max)};if(!validRange(x)||!validRange(y))return false;if(s?.yScaleType==="logarithmic"&&bounds.y.min<=0)return false;scale=s?.yScaleType==="logarithmic"?"logarithmic":"linear";range={x:cx(x),y:cy(y)};return true},
    getYScaleType(){return scale},
    setYScaleType(t){if(t==="logarithmic"&&bounds.y.min<=0)return false;scale=t==="logarithmic"?"logarithmic":"linear";return true},
    panX(d){range.x=cx({min:range.x.min+d,max:range.x.max+d})},
    panYByPixels(px,h){const span=range.y.max-range.y.min;range.y=cy({min:range.y.min+(px/Math.max(1,h))*span,max:range.y.max+(px/Math.max(1,h))*span})},
    zoomX(f,a){const r=range.x,span=r.max-r.min,next=Math.max((bounds.x.max-bounds.x.min)/1000,Math.min(bounds.x.max-bounds.x.min,span*f)),anchor=Number.isFinite(a)?a:(r.min+r.max)/2,ratio=(anchor-r.min)/span;range.x=cx({min:anchor-ratio*next,max:anchor+(1-ratio)*next})},
    zoomY(f,a){const r=range.y,span=r.max-r.min,next=Math.max((bounds.y.max-bounds.y.min)/1000,Math.min(bounds.y.max-bounds.y.min,span*f)),anchor=Number.isFinite(a)?a:(r.min+r.max)/2,ratio=(anchor-r.min)/span;range.y=cy({min:anchor-ratio*next,max:anchor+(1-ratio)*next})},
    fitX(t){range.x=cx(t)},fitY(t){range.y=cy(t)},fitAll(){range={x:{...bounds.x},y:{...bounds.y}}},
    priceAtYRatio(r){return range.y.max-(range.y.max-range.y.min)*clamp(r,0,1)}
  };
}