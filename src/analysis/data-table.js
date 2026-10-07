/* ORACULUM — dados utilizados */
export function openDataTable({rows,keys,assets,fmt,date}){
 const modal=document.createElement('div');modal.className='analysis-info-modal';
 const headers=['DATA',...keys.map(k=>assets[k]?.symbol||k)];const body=rows.map(r=>'<tr><td>'+date(r.timestamp)+'</td>'+keys.map(k=>'<td>'+fmt(r[k],assets[k]?.symbol==='BTC'?2:4)+'</td>').join('')+'</tr>').join('');
 modal.innerHTML='<div class="analysis-modal-backdrop"></div><section class="analysis-info-panel data-table-panel" role="dialog" aria-modal="true"><header><div><strong>DADOS UTILIZADOS</strong><small>'+rows.length+' observações · '+date(rows[0]?.timestamp)+' → '+date(rows.at(-1)?.timestamp)+'</small></div><button class="analysis-close" aria-label="Fechar">×</button></header><div class="analysis-info-body"><p>Esta é a amostra efetivamente utilizada na comparação, após alinhamento pelos timestamps e aplicação do período selecionado. Valores são preços da série normalizada usada pelo estudo.</p><div class="data-table-wrap"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table></div></div></section>';
 const close=()=>modal.remove();modal.querySelector('.analysis-close').onclick=close;modal.querySelector('.analysis-modal-backdrop').onclick=close;document.body.appendChild(modal);
}
