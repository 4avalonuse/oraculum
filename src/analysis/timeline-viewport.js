/* Owns navigation of the sequential viewport; never changes analysis windows. */
export function createSequentialViewport(){
 let page=0;
 return {
   get page(){return page;},
   reset(){page=0;},
   size(slots,rowsInWindow){return Math.max(1,slots[0]?rowsInWindow(slots[0]).length:1);},
   lastPage(slots,rowsInWindow){
     const size=this.size(slots,rowsInWindow);
     const total=slots.reduce((sum,slot)=>sum+rowsInWindow(slot).length,0);
     return Math.max(0,Math.ceil(total/size)-1);
   },
   start(slots,rowsInWindow){return Math.min(page,this.lastPage(slots,rowsInWindow))*this.size(slots,rowsInWindow);},
   previous(){page=Math.max(0,page-1);return page;},
   next(slots,rowsInWindow){page=Math.min(this.lastPage(slots,rowsInWindow),page+1);return page;}
 };
}
