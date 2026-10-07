import { getAsset,DEFAULT_ASSET,ASSET_CATEGORIES,getAssetsByCategory } from '../data/assets.js';

export function attachAssetPicker({load,getActiveSymbol,setActiveSymbol,getActiveInterval}){
  const pickerToggle=document.querySelector('#asset-picker-toggle');
  const pickerMenu=document.querySelector('#asset-picker-menu');
  const pickerClose=document.querySelector('#asset-picker-close');
  const categoryList=document.querySelector('#asset-category-list');
  const optionList=document.querySelector('#asset-option-list');
  const label=document.querySelector('#asset-picker-label');
  let activeAssetCategory=getAsset(DEFAULT_ASSET).category;

  function close(){
    pickerMenu?.classList.remove('open');
    pickerToggle?.setAttribute('aria-expanded','false');
  }

  function render(){
    if(!categoryList||!optionList)return;

    categoryList.innerHTML=ASSET_CATEGORIES.map(category=>{
      const count=getAssetsByCategory(category.id).length;
      return '<button class="asset-category'+(category.id===activeAssetCategory?' active':'')+'" data-category="'+category.id+'" type="button">'+
        '<span>'+category.label+'</span><small>'+count+'</small></button>';
    }).join('');

    optionList.innerHTML=getAssetsByCategory(activeAssetCategory).map(asset=>{
      const selected=asset.value===getActiveSymbol();
      return '<button class="asset-option'+(selected?' active':'')+'" data-asset="'+asset.value+'" type="button">'+
        '<span><strong>'+asset.symbol+'</strong><small>'+asset.name+'</small></span>'+
        (selected?'<b aria-hidden="true">✓</b>':'')+
        '</button>';
    }).join('');

    categoryList.querySelectorAll('[data-category]').forEach(button=>{
      button.addEventListener('click',()=>{
        activeAssetCategory=button.dataset.category;
        render();
      });
    });

    optionList.querySelectorAll('[data-asset]').forEach(button=>{
      button.addEventListener('click',()=>{
        const next=button.dataset.asset;
        if(next===getActiveSymbol()){
          close();
          return;
        }
        setActiveSymbol(next);
        const asset=getAsset(next);
        activeAssetCategory=asset.category;
        label.textContent=asset.symbol;
        document.querySelector('#asset-title').textContent=asset.symbol+' / USD';
        close();
        render();
        load(getActiveInterval());
      });
    });
  }

  pickerToggle?.addEventListener('click',()=>{
    const open=!pickerMenu?.classList.contains('open');
    pickerMenu?.classList.toggle('open',open);
    pickerToggle.setAttribute('aria-expanded',String(open));
    if(open)render();
  });

  pickerClose?.addEventListener('click',close);

  document.addEventListener('click',event=>{
    if(!event.target.closest('.asset-picker'))close();
  });

  render();

  return {render,close};
}
