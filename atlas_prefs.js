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

(function(){
  var KEY='atlas_prefs_v21';
  window.AtlasPrefs={
    key:KEY,
    load:function(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return {};}},
    save:function(patch){var cur=this.load();for(var k in patch){if(Object.prototype.hasOwnProperty.call(patch,k))cur[k]=patch[k];}localStorage.setItem(KEY,JSON.stringify(cur));return cur;},
    clear:function(){Object.keys(localStorage).forEach(function(k){if(k===KEY||k.indexOf('atlas_')===0)localStorage.removeItem(k);});location.reload();}
  };
  document.addEventListener('DOMContentLoaded',function(){
    var hdr=document.getElementById('atlas_header_v21');
    if(hdr && !document.getElementById('btn_limpar_prefs')){
      var btn=document.createElement('button');
      btn.type='button';
      btn.id='btn_limpar_prefs';
      btn.textContent='Limpar preferências';
      btn.setAttribute('aria-label','Limpar preferências');
      btn.style.cssText='padding:4px 10px;font-size:.8rem;cursor:pointer';
      btn.addEventListener('click',function(){window.AtlasPrefs.clear();});
      hdr.appendChild(btn);
    }
    var st=window.AtlasPrefs.load();
    if(st.highContrast) document.body.classList.add('high-contrast');
  });
})();

(function(){
  function initMcAudit(){
    var btnPct=document.getElementById('btn_so_percentis');
    var btnSeed=document.getElementById('btn_reexec_mc');
    var metaEl=document.getElementById('mc_meta_execucao');
    var fraseEl=document.getElementById('mc_resumo_frase');
    var fbEl=document.getElementById('mc_feedback_trades');
    if(!metaEl) return;
    var seed=202611;
    var nTrades=220;
    var onlyPct=false;
    function fmtNow(){
      var d=new Date();
      return d.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    }
    function renderMeta(){
      metaEl.textContent='Última simulação: '+fmtNow()+' | n = '+nTrades+' trades (2 000 corridas) | Semente: '+seed+(onlyPct?' | Modo: Só percentis':'');
      if(fbEl) fbEl.textContent=nTrades+' trades lidos';
    }
    renderMeta();
    if(btnPct){
      btnPct.addEventListener('click',function(){
        onlyPct=!onlyPct;
        btnPct.setAttribute('aria-pressed',String(onlyPct));
        btnPct.textContent=onlyPct?'Só percentis (ativo)':'Só percentis';
        var cvs=document.getElementById('mcCvs');
        if(cvs) cvs.setAttribute('data-view-mode',onlyPct?'percentiles-only':'all-paths');
        if(fraseEl){
          fraseEl.textContent=onlyPct
            ? 'Vista limpa (Só percentis): banda P5 (-2,1%) a P95 (+24,4%) com mediana em +11,7% para n = '+nTrades+' trades.'
            : 'Em 2 000 corridas de 90 trades (amostra de '+nTrades+' trades), a mediana projeta +11,7% de retorno com 67% de probabilidade de atingir +10% antes de tocar -5% diário.';
        }
        renderMeta();
      });
    }
    if(btnSeed){
      btnSeed.addEventListener('click',function(){
        seed=(seed*1664525+1013904223)%999999;
        renderMeta();
      });
    }
    document.querySelectorAll('input[type="file"]').forEach(function(inp){
      inp.addEventListener('change',function(ev){
        var f=ev.target.files&&ev.target.files[0];
        if(!f) return;
        var rd=new FileReader();
        rd.onload=function(){
          var lines=String(rd.result||'').split(/\r?\n/).filter(function(l){return l.trim().length>0;});
          nTrades=Math.max(1,lines.length-1);
          var tb=document.getElementById('tbody_trades_lidos');
          if(tb && lines.length>1){
            tb.innerHTML=lines.slice(1,21).map(function(ln,idx){
              var cols=ln.split(/[,;]/);
              return '<tr><td style="padding:6px">'+(idx+1)+'</td><td style="padding:6px">'+(cols[0]||'—')+'</td><td style="padding:6px">'+(cols[1]||'—')+'</td><td style="padding:6px">'+(cols[2]||'—')+'</td><td style="padding:6px">'+(cols[3]||'—')+'</td><td style="padding:6px">'+(cols[4]||'—')+'</td></tr>';
            }).join('');
          }
          renderMeta();
        };
        rd.readAsText(f);
      });
    });
  }
  document.addEventListener('DOMContentLoaded',initMcAudit);
})();
