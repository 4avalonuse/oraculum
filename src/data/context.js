export const CONTEXT_SERIES={
  CPI_US:{key:'CPI_US',name:'Inflação · CPI EUA',category:'macro',provider:'fred',symbol:'CPIAUCSL',frequency:'1M',unit:'index',source:'BLS via FRED',description:'Índice de preços ao consumidor usado como deflator.'},
  GOLD:{key:'GOLD',name:'Ouro',category:'commodity',provider:'yahoo',symbol:'GC=F',frequency:'1d',unit:'USD/oz',source:'Yahoo Finance'},
  OIL_WTI:{key:'OIL_WTI',name:'Petróleo WTI',category:'commodity',provider:'yahoo',symbol:'CL=F',frequency:'1d',unit:'USD/bbl',source:'Yahoo Finance'},
  SP500:{key:'SP500',name:'S&P 500',category:'index',provider:'yahoo',symbol:'^GSPC',frequency:'1d',unit:'index',source:'Yahoo Finance'},
  DXY:{key:'DXY',name:'Dólar · DXY',category:'fx',provider:'yahoo',symbol:'DX-Y.NYB',frequency:'1d',unit:'index',source:'Yahoo Finance'}
};

export const CONTEXT_GROUPS=[
  {key:'macro',label:'MACRO',items:['CPI_US']},
  {key:'commodities',label:'COMMODITIES',items:['GOLD','OIL_WTI']},
  {key:'indices',label:'ÍNDICES',items:['SP500']},
  {key:'fx',label:'CÂMBIO',items:['DXY']}
];

export function getContextSeries(key){return CONTEXT_SERIES[key]||null}
