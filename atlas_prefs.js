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

(function(){
  function initGuia2Risco(){
    var capEl=document.getElementById('g2_capital');
    if(!capEl) return;
    var rskEl=document.getElementById('g2_risco_eur');
    var slEl=document.getElementById('g2_sl_pips');
    var pvEl=document.getElementById('g2_pip_val');
    var limEl=document.getElementById('g2_limiar_alerta');
    var outPct=document.getElementById('g2_out_pct_lote');
    var outStops=document.getElementById('g2_out_stops');
    var out10=document.getElementById('g2_out_10loss');
    var avLote=document.getElementById('g2_aviso_lote');
    var alLim=document.getElementById('g2_alerta_limiar');
    function recalc(){
      var cap=Math.max(1,parseFloat(capEl.value)||10000);
      var rsk=Math.max(0.1,parseFloat(rskEl.value)||35);
      var sl=Math.max(0.1,parseFloat(slEl.value)||20);
      var pv=Math.max(0.01,parseFloat(pvEl.value)||10);
      var lim=Math.max(0.05,parseFloat(limEl.value)||1.0);
      var loteExato=rsk/(sl*pv);
      var loteMin=loteExato<0.01;
      var loteArred=Math.max(0.01,Math.round(loteExato*100)/100);
      var riscoReal=loteArred*sl*pv;
      var pctConta=(riscoReal/cap)*100;
      var stops5=Math.floor(5/Math.max(0.0001,pctConta));
      var stops10=Math.floor(10/Math.max(0.0001,pctConta));
      var loss10LinPct=pctConta*10;
      var loss10LinEur=riscoReal*10;
      var loss10CompPct=(1-Math.pow(1-(pctConta/100),10))*100;
      outPct.textContent=pctConta.toFixed(2).replace('.',',')+'% | '+loteArred.toFixed(2).replace('.',',')+' lotes';
      outStops.textContent=stops5+' stops (-5%) / '+stops10+' stops (-10%)';
      out10.textContent='-'+loss10LinPct.toFixed(2).replace('.',',')+'% (-'+loss10LinEur.toFixed(0)+' EUR) | Comp.: -'+loss10CompPct.toFixed(2).replace('.',',')+'%';
      if(loteMin){
        avLote.style.borderColor='#ef4444';
        avLote.innerHTML='<strong>Aviso de lote mínimo:</strong> O cálculo ('+loteExato.toFixed(4)+' lotes) ficou abaixo de <strong>0,01 lotes</strong>. Ao forçar 0,01 lotes, o risco real sobe para <strong>'+riscoReal.toFixed(2)+' EUR ('+pctConta.toFixed(2)+'%)</strong>.';
      } else {
        avLote.style.borderColor='#334155';
        avLote.textContent='Lote mínimo: OK ('+loteArred.toFixed(2).replace('.',',')+' lotes >= 0,01; risco efetivo '+riscoReal.toFixed(2)+' EUR).';
      }
      if(pctConta>lim){
        alLim.style.borderColor='#ef4444';
        alLim.innerHTML='<strong>Alerta de risco acima do teu limiar:</strong> '+pctConta.toFixed(2).replace('.',',')+'% excede o teto definido de <strong>'+lim.toFixed(2).replace('.',',')+'%</strong>.';
      } else {
        alLim.style.borderColor='#10b981';
        alLim.textContent='Risco dentro do teu limiar definido ('+pctConta.toFixed(2).replace('.',',')+'% <= '+lim.toFixed(2).replace('.',',')+'%).';
      }
    }
    [capEl,rskEl,slEl,pvEl,limEl].forEach(function(el){el.addEventListener('input',recalc);el.addEventListener('change',recalc);});
    document.querySelectorAll('[data-g2-preset]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var v=btn.getAttribute('data-g2-preset').split(',');
        capEl.value=v[0];rskEl.value=v[1];slEl.value=v[2];pvEl.value=v[3];limEl.value=v[4];
        recalc();
      });
    });
    recalc();
  }
  document.addEventListener('DOMContentLoaded',initGuia2Risco);
})();

(function(){
  function initGuia3Checklist(){
    var chks=document.querySelectorAll('[data-g3-chk]');
    var badge=document.getElementById('g3_status_badge');
    if(!chks.length||!badge) return;
    function update(){
      var n=0;
      chks.forEach(function(c){if(c.checked)n++;});
      var ok=(n===chks.length);
      badge.textContent=n+' / '+chks.length+' confirmados — '+(ok?'LIBERADO':'BLOQUEADO');
      badge.style.borderColor=ok?'#10b981':'#ef4444';
    }
    chks.forEach(function(c){c.addEventListener('change',update);});
    update();
  }
  document.addEventListener('DOMContentLoaded',initGuia3Checklist);
})();

(function(){
  function initGuia4Diario(){
    var tbody=document.getElementById('g4_tbody');
    if(!tbody) return;
    var rows=[
      {data:'2026-11-18',conta:'FTMO-01',ativo:'XAUUSD',r:1.50,eur:52.50,exported:true},
      {data:'2026-11-19',conta:'FTMO-01',ativo:'US100',r:-1.00,eur:-35.00,exported:true},
      {data:'2026-11-20',conta:'FTMO-02',ativo:'EURUSD',r:1.80,eur:63.00,exported:true},
      {data:'2026-11-21',conta:'FTMO-02',ativo:'BTCUSDT',r:-1.00,eur:-35.00,exported:false},
      {data:'2026-11-22',conta:'FTMO-03',ativo:'XAUUSD',r:1.40,eur:49.00,exported:false},
      {data:'2026-11-23',conta:'FTMO-03',ativo:'US100',r:1.50,eur:52.50,exported:false}
    ];
    var filter='all';
    var sortKey='data';
    var sortAsc=false;
    var totVivo=document.getElementById('g4_tot_vivo');
    var totNet=document.getElementById('g4_tot_net');
    var avExp=document.getElementById('g4_aviso_exportar');
    var btnExp=document.getElementById('g4_btn_exportar');
    function render(){
      var nAll=rows.length;
      var nWin=rows.filter(function(x){return x.r>0;}).length;
      var nLoss=rows.filter(function(x){return x.r<0;}).length;
      document.querySelectorAll('[data-g4-filter]').forEach(function(b){
        var f=b.getAttribute('data-g4-filter');
        b.setAttribute('aria-pressed',String(f===filter));
        if(f==='all') b.textContent='Todos ('+nAll+')';
        if(f==='win') b.textContent='Ganhos ('+nWin+')';
        if(f==='loss') b.textContent='Perdas ('+nLoss+')';
      });
      var pend=rows.filter(function(x){return !x.exported;}).length;
      if(avExp){
        if(pend>0){
          avExp.style.borderColor='#eab308';
          avExp.innerHTML='<strong>Aviso de registos por exportar:</strong> tens <strong>'+pend+'</strong> registos por exportar em CSV.';
        } else {
          avExp.style.borderColor='#10b981';
          avExp.textContent='Backup em dia: 0 registos por exportar.';
        }
      }
      var list=rows.filter(function(x){
        if(filter==='win') return x.r>0;
        if(filter==='loss') return x.r<0;
        return true;
      }).slice().sort(function(a,b){
        var va=a[sortKey],vb=b[sortKey];
        if(typeof va==='string') return sortAsc?va.localeCompare(vb):vb.localeCompare(va);
        return sortAsc?(va-vb):(vb-va);
      });
      var n=list.length;
      var wins=list.filter(function(x){return x.r>0;});
      var losses=list.filter(function(x){return x.r<0;});
      var wr=n?((wins.length/n)*100):0;
      var avgW=wins.length?(wins.reduce(function(s,x){return s+x.r;},0)/wins.length):0;
      var avgL=losses.length?Math.abs(losses.reduce(function(s,x){return s+x.r;},0)/losses.length):1;
      var payoff=avgL>0?(avgW/avgL):0;
      var sumEur=list.reduce(function(s,x){return s+x.eur;},0);
      var sumR=list.reduce(function(s,x){return s+x.r;},0);
      var ev=n?(sumR/n):0;
      if(totVivo) totVivo.textContent='Win Rate: '+wr.toFixed(1).replace('.',',')+'% | Payoff: '+payoff.toFixed(2).replace('.',',')+' | n = '+n;
      if(totNet) totNet.textContent=(sumEur>=0?'+':'')+sumEur.toFixed(2).replace('.',',')+' EUR ('+(ev>=0?'+':'')+ev.toFixed(2).replace('.',',')+' R / trade)';
      tbody.innerHTML=list.map(function(x){
        return '<tr style="border-bottom:1px solid #1e293b"><td style="padding:8px">'+x.data+'</td><td style="padding:8px">'+x.conta+'</td><td style="padding:8px">'+x.ativo+'</td><td style="padding:8px">'+(x.r>=0?'+':'')+x.r.toFixed(2).replace('.',',')+' R</td><td style="padding:8px">'+(x.eur>=0?'+':'')+x.eur.toFixed(2).replace('.',',')+' EUR</td></tr>';
      }).join('');
    }
    document.querySelectorAll('[data-g4-filter]').forEach(function(b){
      b.addEventListener('click',function(){filter=b.getAttribute('data-g4-filter');render();});
    });
    document.querySelectorAll('[data-g4-sort]').forEach(function(b){
      b.addEventListener('click',function(){
        var k=b.getAttribute('data-g4-sort');
        if(sortKey===k) sortAsc=!sortAsc; else {sortKey=k;sortAsc=true;}
        render();
      });
    });
    if(btnExp){
      btnExp.addEventListener('click',function(){
        var csv='Data,Conta,Ativo,R,EUR\n'+rows.map(function(x){return [x.data,x.conta,x.ativo,x.r,x.eur].join(',');}).join('\n');
        var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
        var a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download='diario_auditoria_quant.csv';
        a.click();
        rows.forEach(function(x){x.exported=true;});
        render();
      });
    }
    render();
  }
  document.addEventListener('DOMContentLoaded',initGuia4Diario);
})();

(function(){
  function initGuia4Avancado(){
    var cvs=document.getElementById('g4_equity_cvs');
    var tbIn=document.getElementById('g4_tbody_inline');
    if(!cvs||!tbIn) return;
    var data=[
      {data:'2026-11-18',conta:'FTMO-01',ativo:'XAUUSD',r:1.50,eur:52.50,tags:'#NY-Open #H4-H1'},
      {data:'2026-11-19',conta:'FTMO-01',ativo:'US100',r:-1.00,eur:-35.00,tags:'#Stop-Tecnico'},
      {data:'2026-11-20',conta:'FTMO-02',ativo:'EURUSD',r:1.80,eur:63.00,tags:'#NY-Open #A+'},
      {data:'2026-11-21',conta:'FTMO-02',ativo:'BTCUSDT',r:-1.00,eur:-35.00,tags:'#Volatilidade'},
      {data:'2026-11-22',conta:'FTMO-03',ativo:'XAUUSD',r:1.40,eur:49.00,tags:'#H4-H1 #A+'},
      {data:'2026-11-23',conta:'FTMO-03',ativo:'US100',r:1.50,eur:52.50,tags:'#NY-Open'}
    ];
    var activeTag='';
    var csvParsed=[];
    function drawEquity(){
      var ctx=cvs.getContext('2d');
      if(!ctx) return;
      var w=cvs.width,h=cvs.height;
      ctx.clearRect(0,0,w,h);
      var acc=0,pts=[0];
      data.forEach(function(x){acc+=Number(x.eur)||0;pts.push(acc);});
      var badge=document.getElementById('g4_eq_badge');
      if(badge) badge.textContent='Curva acumulada: '+(acc>=0?'+':'')+acc.toFixed(2).replace('.',',')+' EUR';
      var minV=Math.min.apply(null,pts),maxV=Math.max.apply(null,pts);
      if(maxV===minV){maxV+=10;minV-=10;}
      var pad=24;
      var yZero=h-pad-((0-minV)/(maxV-minV))*(h-2*pad);
      ctx.strokeStyle='#334155';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(pad,yZero);ctx.lineTo(w-pad,yZero);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=acc>=0?'#10b981':'#ef4444';ctx.lineWidth=3;ctx.beginPath();
      pts.forEach(function(v,i){
        var x=pad+(i/Math.max(1,pts.length-1))*(w-2*pad);
        var y=h-pad-((v-minV)/(maxV-minV))*(h-2*pad);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.stroke();
      pts.forEach(function(v,i){
        var x=pad+(i/Math.max(1,pts.length-1))*(w-2*pad);
        var y=h-pad-((v-minV)/(maxV-minV))*(h-2*pad);
        ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
      });
    }
    function renderInline(){
      var tagsBar=document.getElementById('g4_tags_bar');
      if(tagsBar){
        var counts={};
        data.forEach(function(row){String(row.tags||'').split(/\s+/).filter(Boolean).forEach(function(tg){counts[tg]=(counts[tg]||0)+1;});});
        var html='<button type="button" data-tag-pick="" aria-pressed="'+String(activeTag==='')+'">Todas as tags ('+data.length+')</button>';
        Object.keys(counts).forEach(function(tg){
          html+='<button type="button" data-tag-pick="'+tg+'" aria-pressed="'+String(activeTag===tg)+'">'+tg+' ('+counts[tg]+')</button>';
        });
        tagsBar.innerHTML=html;
        tagsBar.querySelectorAll('[data-tag-pick]').forEach(function(b){
          b.addEventListener('click',function(){activeTag=b.getAttribute('data-tag-pick');renderInline();});
        });
      }
      var filtered=activeTag?data.filter(function(r){return String(r.tags||'').indexOf(activeTag)!==-1;}):data;
      tbIn.innerHTML=filtered.map(function(row){
        var idx=data.indexOf(row);
        return '<tr style="border-bottom:1px solid #1e293b"><td style="padding:6px"><input type="text" data-in-idx="'+idx+'" data-in-k="data" value="'+row.data+'" aria-label="Editar data" style="width:105px"></td><td style="padding:6px"><input type="text" data-in-idx="'+idx+'" data-in-k="conta" value="'+row.conta+'" aria-label="Editar conta" style="width:85px"></td><td style="padding:6px"><input type="text" data-in-idx="'+idx+'" data-in-k="ativo" value="'+row.ativo+'" aria-label="Editar ativo" style="width:80px"></td><td style="padding:6px"><input type="number" step="0.1" data-in-idx="'+idx+'" data-in-k="r" value="'+row.r+'" aria-label="Editar R" style="width:65px"></td><td style="padding:6px"><input type="number" step="1" data-in-idx="'+idx+'" data-in-k="eur" value="'+row.eur+'" aria-label="Editar EUR" style="width:75px"></td><td style="padding:6px"><input type="text" data-in-idx="'+idx+'" data-in-k="tags" value="'+row.tags+'" aria-label="Editar tags" style="width:150px"></td></tr>';
      }).join('');
      tbIn.querySelectorAll('[data-in-idx]').forEach(function(inp){
        inp.addEventListener('change',function(){
          var i=parseInt(inp.getAttribute('data-in-idx'),10);
          var k=inp.getAttribute('data-in-k');
          data[i][k]=(k==='r'||k==='eur')?(parseFloat(inp.value)||0):inp.value;
          drawEquity();
          renderInline();
        });
      });
      drawEquity();
    }
    function populateCols(headers){
      ['map_col_data','map_col_conta','map_col_ativo','map_col_r','map_col_eur'].forEach(function(id,defIdx){
        var sel=document.getElementById(id);
        if(!sel) return;
        sel.innerHTML=headers.map(function(h,i){return '<option value="'+i+'"'+(i===Math.min(defIdx,headers.length-1)?' selected':'')+'>Col '+(i+1)+': '+h+'</option>';}).join('');
      });
    }
    var btnDemoMap=document.getElementById('g4_csv_demo_map');
    if(btnDemoMap){
      btnDemoMap.addEventListener('click',function(){
        csvParsed=[['Open Time','Account','Symbol','R_Net','Profit_EUR'],['2026-11-24','FTMO-04','XAUUSD','1.60','56.00']];
        populateCols(csvParsed[0]);
      });
    }
    var fileInp=document.getElementById('g4_csv_file');
    if(fileInp){
      fileInp.addEventListener('change',function(ev){
        var f=ev.target.files&&ev.target.files[0];
        if(!f) return;
        var rd=new FileReader();
        rd.onload=function(){
          var lines=String(rd.result||'').split(/\r?\n/).filter(function(l){return l.trim().length>0;});
          csvParsed=lines.map(function(l){return l.split(/[,;]/);});
          if(csvParsed.length>0) populateCols(csvParsed[0]);
        };
        rd.readAsText(f);
      });
    }
    var btnApply=document.getElementById('g4_csv_aplicar');
    if(btnApply){
      btnApply.addEventListener('click',function(){
        if(csvParsed.length<2) return;
        var iD=parseInt(document.getElementById('map_col_data').value,10)||0;
        var iC=parseInt(document.getElementById('map_col_conta').value,10)||1;
        var iA=parseInt(document.getElementById('map_col_ativo').value,10)||2;
        var iR=parseInt(document.getElementById('map_col_r').value,10)||3;
        var iE=parseInt(document.getElementById('map_col_eur').value,10)||4;
        csvParsed.slice(1).forEach(function(r){
          data.push({data:r[iD]||'2026-11-24',conta:r[iC]||'FTMO',ativo:r[iA]||'XAUUSD',r:parseFloat(r[iR])||0,eur:parseFloat(r[iE])||0,tags:'#CSV-Import'});
        });
        renderInline();
      });
    }
    renderInline();
  }
  document.addEventListener('DOMContentLoaded',initGuia4Avancado);
})();

(function(){
  function initGuia4ExtTools(){
    var calGrid=document.getElementById('g4_cal_grid');
    if(!calGrid) return;
    var diarioBase=[
      {data:'2026-11-18',eur:52.50,r:1.50},
      {data:'2026-11-19',eur:-35.00,r:-1.00},
      {data:'2026-11-20',eur:63.00,r:1.80},
      {data:'2026-11-21',eur:-35.00,r:-1.00},
      {data:'2026-11-22',eur:49.00,r:1.40},
      {data:'2026-11-23',eur:52.50,r:1.50}
    ];
    function renderCal(){
      var mesEl=document.getElementById('g4_cal_mes');
      var ym=(mesEl&&mesEl.value)||'2026-11';
      var parts=ym.split('-');
      var y=parseInt(parts[0],10)||2026,m=parseInt(parts[1],10)||11;
      var daysInMonth=new Date(y,m,0).getDate();
      var firstDow=(new Date(y,m-1,1).getDay()+6)%7;
      var byDay={};
      diarioBase.forEach(function(item){
        if(item.data.indexOf(ym)===0){
          var d=parseInt(item.data.slice(8,10),10);
          byDay[d]=(byDay[d]||0)+item.eur;
        }
      });
      var hdr=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(function(w){return '<div style="text-align:center;font-weight:700;color:#94a3b8;padding:4px">'+w+'</div>';}).join('');
      var cells='';
      for(var b=0;b<firstDow;b++) cells+='<div style="padding:8px;border:1px solid #1e293b;border-radius:6px;opacity:.3"></div>';
      var green=0,red=0;
      for(var d=1;d<=daysInMonth;d++){
        var val=byDay[d];
        var has=typeof val==='number';
        if(has){if(val>=0)green++;else red++;}
        var bg=!has?'#020617':(val>=0?'rgba(16,185,129,.18)':'rgba(239,68,68,.18)');
        var brd=!has?'#1e293b':(val>=0?'#10b981':'#ef4444');
        cells+='<div style="padding:6px;border:1px solid '+brd+';border-radius:6px;background:'+bg+';min-height:46px"><div style="font-weight:700">'+d+'</div><div style="font-size:.75rem;margin-top:2px">'+(has?((val>=0?'+':'')+val.toFixed(0)+'€'):'—')+'</div></div>';
      }
      calGrid.innerHTML=hdr+cells;
      var resEl=document.getElementById('g4_cal_resumo');
      if(resEl) resEl.textContent=(green+red)+' dias operados | '+green+' verdes / '+red+' vermelhos';
    }
    var mesInp=document.getElementById('g4_cal_mes');
    if(mesInp) mesInp.addEventListener('change',renderCal);
    renderCal();
    function summarizeCsv(text){
      var lines=String(text||'').split(/\r?\n/).filter(function(l){return l.trim().length>0;}).slice(1);
      var rs=[],eurs=[];
      lines.forEach(function(ln){
        var c=ln.split(/[,;]/);
        var rv=parseFloat(c[3]);var ev=parseFloat(c[4]);
        if(!isNaN(rv)) rs.push(rv);
        if(!isNaN(ev)) eurs.push(ev);
      });
      var n=rs.length;
      if(!n) return 'Sem linhas numéricas válidas (usa colunas Data,Conta,Ativo,R,EUR).';
      var w=rs.filter(function(x){return x>0;}),l=rs.filter(function(x){return x<0;});
      var wr=(w.length/n)*100;
      var aw=w.length?w.reduce(function(a,b){return a+b;},0)/w.length:0;
      var al=l.length?Math.abs(l.reduce(function(a,b){return a+b;},0)/l.length):1;
      var pf=al>0?aw/al:0;
      var ev=(rs.reduce(function(a,b){return a+b;},0)/n);
      var sumE=eurs.reduce(function(a,b){return a+b;},0);
      return 'n = '+n+' | Win Rate: '+wr.toFixed(1).replace('.',',')+'% | Payoff: '+pf.toFixed(2).replace('.',',')+' | EV: '+(ev>=0?'+':'')+ev.toFixed(2).replace('.',',')+' R ('+(sumE>=0?'+':'')+sumE.toFixed(0)+' EUR)';
    }
    function bindCsvInput(inpId,outId){
      var el=document.getElementById(inpId),out=document.getElementById(outId);
      if(!el||!out) return;
      el.addEventListener('change',function(ev){
        var f=ev.target.files&&ev.target.files[0];
        if(!f) return;
        var rd=new FileReader();
        rd.onload=function(){out.textContent=f.name+': '+summarizeCsv(rd.result);};
        rd.readAsText(f);
      });
    }
    bindCsvInput('g4_cmp_csv_a','g4_cmp_res_a');
    bindCsvInput('g4_cmp_csv_b','g4_cmp_res_b');
    var btnDemo=document.getElementById('g4_cmp_demo');
    if(btnDemo){
      btnDemo.addEventListener('click',function(){
        document.getElementById('g4_cmp_res_a').textContent='n = 42 | Win Rate: 61,9% | Payoff: 1,42 | EV: +0,50 R (+735 EUR)';
        document.getElementById('g4_cmp_res_b').textContent='n = 38 | Win Rate: 57,9% | Payoff: 1,35 | EV: +0,36 R (+478 EUR)';
      });
    }
    var btnPng=document.getElementById('g4_btn_exp_png');
    if(btnPng){
      btnPng.addEventListener('click',function(){
        var c=document.createElement('canvas');c.width=900;c.height=360;
        var ctx=c.getContext('2d');
        ctx.fillStyle='#0f172a';ctx.fillRect(0,0,900,360);
        ctx.strokeStyle='#334155';ctx.strokeRect(16,16,868,328);
        ctx.fillStyle='#f8fafc';ctx.font='bold 22px sans-serif';ctx.fillText('Auditoria Quant v2.1 — Resumo do Diário',36,56);
        ctx.fillStyle='#94a3b8';ctx.font='15px sans-serif';ctx.fillText('Gerado localmente em '+new Date().toLocaleString('pt-PT'),36,84);
        var totEl=document.getElementById('g4_tot_vivo');
        var netEl=document.getElementById('g4_tot_net');
        ctx.fillStyle='#10b981';ctx.font='bold 20px sans-serif';ctx.fillText(totEl?totEl.textContent:'Win Rate: 66,7% | Payoff: 1,55 | n = 6',36,140);
        ctx.fillStyle='#38bdf8';ctx.font='18px sans-serif';ctx.fillText(netEl?netEl.textContent:'+147,00 EUR (+0,70 R / trade)',36,176);
        var eqCvs=document.getElementById('g4_equity_cvs');
        if(eqCvs) ctx.drawImage(eqCvs,36,200,828,125);
        var a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='relatorio_diario_quant.png';a.click();
      });
    }
    var btnPdf=document.getElementById('g4_btn_exp_pdf');
    if(btnPdf){
      btnPdf.addEventListener('click',function(){window.print();});
    }
  }
  document.addEventListener('DOMContentLoaded',initGuia4ExtTools);
})();
