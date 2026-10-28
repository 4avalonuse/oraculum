/* Pure plot coordinates: calendar uses real timestamps, relative uses candle frames. */
export function plotCoordinates(plotted, layouts, mode, alignment='start') {
  const calendar=mode==='calendar';
  const timestamps=plotted.flatMap(({rows})=>rows.map(row=>Number(row.timestamp))).filter(Number.isFinite);
  const start=timestamps.length?Math.min(...timestamps):0;
  const end=timestamps.length?Math.max(...timestamps):start;
  const sequential=!calendar&&alignment==='sequential';
  const lengths=plotted.map(({rows})=>rows.length);
  const capacity=calendar?Math.max(1,end-start):sequential?Math.max(1,lengths.reduce((sum,n)=>sum+n,0)-1):Math.max(1,...lengths.map(n=>n-1));
  let offset=0;
  return {
    capacity,start,end,
    curves:plotted.map(({slot,rows,reference})=>{
      const position=calendar?0:(sequential?offset:0);
      if(sequential)offset+=rows.length;
      const firstPrice=Number(rows[0]?.[slot.key]);
      const values=rows.map(row=>100*Number(row[slot.key])/firstPrice);
      const x=rows.map((row,i)=>calendar?(Number(row.timestamp)-start)/capacity:(position+i)/capacity);
      return {slot,rows,reference,position,values,x};
    }).filter(curve=>curve.values.length>0&&curve.values.every(v=>Number.isFinite(v)&&v>0)&&curve.x.every(x=>Number.isFinite(x)&&x>=0&&x<=1))
  };
}
