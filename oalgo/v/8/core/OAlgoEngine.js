// core/OAlgoEngine.js — regras BUY/SELL simples
var OAlgoEngine = (function(){
  function create(initialAlgo){
    let rules = normalize(initialAlgo);
    function normalize(algo){
      const out = [];
      if (algo && Array.isArray(algo.steps)){
        for (const s of algo.steps){
          if (!s) continue;
          const action = (s.action || 'SELL').toUpperCase();
          const op = (s.op || (action==='BUY' ? '<' : '>'));
          const value = Number(s.value) || 0;
          out.push({ action, op, value });
        }
      }
      return out;
    }
    function updateRules(algo){ rules = normalize(algo); }
    function evalAt(price){
      const signals = [];
      for (const r of rules){
        if (r.op === '<' && price < r.value && r.action === 'BUY'){
          signals.push({ type:'BUY', price });
        }
        if (r.op === '>' && price > r.value && r.action === 'SELL'){
          signals.push({ type:'SELL', price });
        }
      }
      return signals;
    }
    return { updateRules, evalAt };
  }
  return { create };
})();
