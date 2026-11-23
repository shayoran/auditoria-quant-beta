const AtlasPrefs=(()=>{const K="atlas_prefs_v21";function load(){try{return JSON.parse(localStorage.getItem(K)||"{}")}catch{return{}}}function save(o){try{localStorage.setItem(K,JSON.stringify(o))}catch{}}function clear(){try{localStorage.removeItem(K)}catch{}}return{load,save,clear}})();
(function(){
  function applyTermos(dict){
    if(!dict) return;
    document.querySelectorAll('[data-term]').forEach(function(el){
      var k=el.getAttribute('data-term');
      var item=dict[k];
      if(!item) return;
      var tip=item.definicao+' Exemplo: '+item.exemplo+' Porquê: '+item.porque;
      el.setAttribute('title',tip);
      if(el.hasAttribute('data-dual-label')){
        el.textContent=item.nome_humano;
      }
      if(el.hasAttribute('data-term-interpretacao')){
        el.textContent=item.definicao+' '+item.porque;
      }
    });
    var boxSorte=document.getElementById('explicacao_depende_sorte');
    if(boxSorte && dict.depende_de_sorte){
      var s=dict.depende_de_sorte;
      boxSorte.innerHTML='<strong>'+s.nome_humano+':</strong> '+s.definicao+' <em>Exemplo:</em> '+s.exemplo+' <em>Porquê:</em> '+s.porque;
    }
    var gloss=document.getElementById('glossario_v21');
    if(gloss){
      var html='<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">Glossário Técnico Auditado ('+Object.keys(dict).length+' termos)</summary><dl style="margin-top:10px;display:grid;gap:10px">';
      Object.keys(dict).forEach(function(k){
        var it=dict[k];
        html+='<div style="padding:8px;border:1px solid #334155;border-radius:6px"><dt style="font-weight:700">'+it.nome_humano+' ['+it.sigla+']</dt><dd style="margin:4px 0 0 0;font-size:.875rem"><strong>Definição:</strong> '+it.definicao+'<br><strong>Exemplo:</strong> '+it.exemplo+'<br><strong>Porquê:</strong> '+it.porque+'</dd></div>';
      });
      html+='</dl></details>';
      gloss.innerHTML=html;
    }
  }
  document.addEventListener('DOMContentLoaded',function(){
    fetch('termos.json').then(function(r){return r.json();}).then(applyTermos).catch(function(){});
  });
})();

(function(){
  function initAtlasCards(){
    document.querySelectorAll('[data-atlas-card]').forEach(function(card){
      var k1=card.querySelector('[data-kpi-1]');
      var k2=card.querySelector('[data-kpi-2]');
      var emptyBox=card.querySelector('[data-card-empty]');
      var btnEx=card.querySelector('[data-card-example]');
      var btnRst=card.querySelector('[data-card-reset]');
      var d1=k1?k1.textContent:'—';
      var d2=k2?k2.textContent:'—';
      var ex1=card.getAttribute('data-ex-1')||d1;
      var ex2=card.getAttribute('data-ex-2')||d2;
      if(btnEx){
        btnEx.addEventListener('click',function(){
          if(k1) k1.textContent=ex1;
          if(k2) k2.textContent=ex2;
          if(emptyBox) emptyBox.style.display='none';
          card.setAttribute('data-state','active');
        });
      }
      if(btnRst){
        btnRst.addEventListener('click',function(){
          if(k1) k1.textContent=d1;
          if(k2) k2.textContent=d2;
          if(emptyBox) emptyBox.style.display='block';
          card.setAttribute('data-state','empty');
        });
      }
    });
  }
  document.addEventListener('DOMContentLoaded',initAtlasCards);
})();
