/* ORACULUM — distribuições para inferência estatística.
   P-valores bilaterais t/normal e cauda superior F.
   HAC usa aproximação normal assintótica; inferência clássica usa t de Student.
*/
function gammaln(z){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,.001208650973866179,-.000005395239384953];let x=z,y=x,t=x+5.5;t-=(x+.5)*Math.log(t);let s=1.000000000190015;for(let j=0;j<c.length;j++){y++;s+=c[j]/y}return -t+Math.log(2.5066282746310005*s/x)}
function betaCF(a,b,x){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;for(let m=1;m<=200;m++){let m2=2*m,aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-14)break}return h}
function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(gammaln(a+b)-gammaln(a)-gammaln(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betaCF(a,b,x)/a:1-bt*betaCF(b,a,1-x)/b}
function tCDF(t,df){if(!Number.isFinite(t)||df<=0)return NaN;if(t===0)return .5;const x=df/(df+t*t),p=.5*ibeta(x,df/2,.5);return t>0?1-p:p}
export function studentTPValue(t,df){if(!Number.isFinite(t)||!(df>0))return NaN;const x=df/(df+t*t);return Math.min(1,Math.max(0,ibeta(x,df/2,.5)))}
export function normalTwoSidedP(z){if(!Number.isFinite(z))return NaN;const x=Math.abs(z),p=0.2316419,b1=0.319381530,b2=-0.356563782,b3=1.781477937,b4=-1.821255978,b5=1.330274429,t=1/(1+p*x),phi=Math.exp(-x*x/2)/Math.sqrt(2*Math.PI),tail=phi*(b1*t+b2*t*t+b3*t**3+b4*t**4+b5*t**5);return Math.min(1,2*tail)}
export function studentTCritical(alpha,df){if(!(alpha>0&&alpha<1&&df>0))return NaN;let lo=0,hi=20;for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(tCDF(mid,df)<1-alpha/2)lo=mid;else hi=mid}return (lo+hi)/2}
export function fUpperTailP(f,d1,d2){if(!(f>=0&&d1>0&&d2>0))return NaN;if(f===Infinity)return 0;const x=d2/(d1*f+d2);return Math.min(1,Math.max(0,ibeta(x,d2/2,d1/2)))}
