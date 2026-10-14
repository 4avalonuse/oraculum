/* ORACULUM — distribuições para inferência estatística.
   P-valores bilaterais t/normal e cauda superior F.
   HAC usa aproximação normal assintótica; inferência clássica usa t de Student.
*/
function gammaln(z){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,.001208650973866179,-.000005395239384953];let x=z,y=x,t=x+5.5;t-=(x+.5)*Math.log(t);let s=1.000000000190015;for(let j=0;j<c.length;j++){y++;s+=c[j]/y}return -t+Math.log(2.5066282746310005*s/x)}
function gammaQ(a,x){
  if(x<0||a<=0)return NaN;if(x===0)return 1;
  if(x<a+1){let ap=a,sum=1/a,del=sum;for(let n=1;n<300;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*3e-14)break}return Math.max(0,Math.min(1,1-sum*Math.exp(-x+a*Math.log(x)-gammaln(a))))}
  let b=x+1-a,c=1e300,d=1/b,h=d;
  for(let i=1;i<300;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-14)break}
  return Math.max(0,Math.min(1,Math.exp(-x+a*Math.log(x)-gammaln(a))*h));
}
function betaCF(a,b,x){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;for(let m=1;m<=200;m++){let m2=2*m,aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-14)break}return h}
function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(gammaln(a+b)-gammaln(a)-gammaln(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betaCF(a,b,x)/a:1-bt*betaCF(b,a,1-x)/b}
function tCDF(t,df){if(!Number.isFinite(t)||df<=0)return NaN;if(t===0)return .5;const x=df/(df+t*t),p=.5*ibeta(x,df/2,.5);return t>0?1-p:p}
export function studentTPValue(t,df){if(!Number.isFinite(t)||!(df>0))return NaN;const x=df/(df+t*t);return Math.min(1,Math.max(0,ibeta(x,df/2,.5)))}
export function normalTwoSidedP(z){if(!Number.isFinite(z))return NaN;return gammaQ(0.5,z*z/2)}
export function studentTCritical(alpha,df){if(!(alpha>0&&alpha<1&&df>0))return NaN;let lo=0,hi=20;for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(tCDF(mid,df)<1-alpha/2)lo=mid;else hi=mid}return (lo+hi)/2}
export function fUpperTailP(f,d1,d2){if(!(f>=0&&d1>0&&d2>0))return NaN;if(f===Infinity)return 0;const x=d2/(d1*f+d2);return Math.min(1,Math.max(0,ibeta(x,d2/2,d1/2)))}
