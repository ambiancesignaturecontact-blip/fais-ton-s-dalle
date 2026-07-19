
var M=[{"id":"l","n":"Menu Léger","c":"menus","p":6.9,"d":"Sandwich (viande + crudités + sauce)","cs":1,"pop":1},{"id":"c","n":"Menu Classique","c":"menus","p":7.9,"d":"Sandwich + boisson","cs":4,"pop":1},{"id":"g","n":"Menu Gourmand","c":"menus","p":9.9,"d":"Sandwich + boisson + dessert","cs":4,"pop":1},{"id":"t","n":"Tiramisu","c":"desserts","p":3,"d":"Fait maison","cs":2},{"id":"m","n":"Milkshake","c":"desserts","p":5,"d":"Personnalisable","cs":3},{"id":"co","n":"Coca-Cola","c":"boissons","p":1},{"id":"cz","n":"Coca Zéro","c":"boissons","p":1},{"id":"pe","n":"Pepsi","c":"boissons","p":1},{"id":"oa","n":"Oasis Tropical","c":"boissons","p":1},{"id":"li","n":"Ice Tea","c":"boissons","p":1},{"id":"or","n":"Orangina","c":"boissons","p":1},{"id":"cr","n":"Cristaline","c":"boissons","p":1},{"id":"sp","n":"San Pellegrino","c":"boissons","p":1}];
var DRINKS=[{"id":"co","n":"Coca-Cola"},{"id":"cz","n":"Coca Zéro"},{"id":"pe","n":"Pepsi"},{"id":"oa","n":"Oasis Tropical"},{"id":"li","n":"Ice Tea"},{"id":"or","n":"Orangina"},{"id":"cr","n":"Cristaline"},{"id":"sp","n":"San Pellegrino"}];
var DESSERTS=[{"id":"t","n":"Tiramisu (3€)"}];
var cart=JSON.parse(localStorage.getItem("c")||"[]"),ci=null,cs={},curPage="acc",pendingItem=null,pendingCust="";
var cmdMode=localStorage.getItem("cmdMode")||"livraison",cmdAddr=localStorage.getItem("cmdAddr")||"";
var VERSION="1.0.3";var DELIVERY_FEE=2.5;
var WA_NUMBERS=["33672044875","33744700167","33611924863"];
var CU=["Froid","Chaud"];
var VI=["Tenders","Emincé poulet","Blanc dinde","Jambon dinde","Pastrami","Rosette","Thon"];
var CR=["Salade","Tomate","Concombre","Oignons","Poivrons","Maïs","Carottes râpées","Avocat"];
var SA=["Mayo","Ketchup","Algérienne","Samouraï","Blanche","Moutarde","Brasil","Chili","Thai"];
var SP=["Cheddar","Mozzarella","Feta"];
var MSC=["Snickers","M&Ms","KitKat","KitKat White"];
var MCL=["Coulis chocolat (+0,50€)","Coulis caramel (+0,50€)","Coulis fraise (+0,50€)"];
var TIR=["Caramel","Chocolat"];
var IMG={l:"/images/menu-leger.jpg",c:"/images/menu-classique.jpg",g:"/images/menu-gourmand.jpg",t:"/images/tiramisu.jpg",m:"/images/milkshake.jpg",co:"/images/coca.jpg",cz:"/images/zero.jpg",pe:"/images/pepsi.jpg",oa:"/images/oasis.jpg",li:"/images/icetea.jpg",or:"/images/orangina.jpg",cr:"/images/cristaline.jpg",sp:"/images/sanpellegrino.jpg"};

function navTo(p){["acc","menu","ap","con"].forEach(function(x){var e=document.getElementById(x);if(e)e.classList.add("h");});document.getElementById(p).classList.remove("h");document.querySelectorAll(".nv a").forEach(function(x){x.classList.remove("sl");});var n=document.getElementById("na-"+p);if(n)n.classList.add("sl");curPage=p;window.location.hash=p;}

function getItem(id){for(var i=0;i<M.length;i++){if(M[i].id===id)return M[i];}return null;}
function getFn(it){if(!it)return null;if(it.cs===2)return"oti";if(it.cs===3)return"omm";if(it.cs===4)return"omc";if(it.cs)return"om";return"ai";}

function handleCardClick(id){
  var it=getItem(id),fn=getFn(it);
  if(fn==="oti")oti();
  else if(fn==="omm")omm(id);
  else if(fn==="omc")omc(id);
  else if(fn==="om")om(id);
  else if(fn==="ai")ai(id);
}

function bindCards(container){
  container.querySelectorAll(".crd").forEach(function(el){
    el.addEventListener("click",function(){handleCardClick(this.dataset.id);});
  });
  container.querySelectorAll(".add-btn").forEach(function(el){
    el.addEventListener("click",function(e){e.stopPropagation();var c=this.closest(".crd");if(c)handleCardClick(c.dataset.id);});
  });
}

function renderMenu(g,el){
  var items=g==="all"?M:M.filter(function(x){return x.c===g;});
  var h="";
  for(var i=0;i<items.length;i++){
    var x=items[i];
    var ig=IMG[x.id]||"/images/coca.jpg";
    var badge=(x.pop&&x.c!=="boissons")?'<span class="pop-badge">Populaire</span>':"";
    h+='<div class="crd" data-id="'+x.id+'"><div class="crd-img" style="background-image:url('+ig+')" loading="lazy">'+badge+'</div><div class="crd-body"><h3>'+x.n+'</h3><div class="crd-desc">'+(x.d||"")+'</div><div class="crd-ft"><span class="crd-pr">'+x.p.toFixed(2)+'€</span><button class="add-btn">+</button></div></div></div>';
  }
  el.innerHTML=h;
  bindCards(el);
}

function setMode(m){
  cmdMode=m;
  localStorage.setItem("cmdMode",m);
  var cl=document.getElementById("cp-mode-livraison"),ce=document.getElementById("cp-mode-emporter");
  if(cl)cl.className=m==="livraison"?"on":"";
  if(ce)ce.className=m==="emporter"?"on":"";
  updateCartMode();
  uc();
  var a=document.getElementById("cp-address");
  if(a)a.style.display=m==="livraison"&&document.getElementById("cp").classList.contains("on")?"block":"none";
}
function updateCartMode(){var cl=document.getElementById("cp-mode-livraison"),ce=document.getElementById("cp-mode-emporter");if(cl)cl.className=cmdMode==="livraison"?"on":"";if(ce)ce.className=cmdMode==="emporter"?"on":"";}

function sel(k,v,el){
  if(k==="r"||k==="p"||k==="cl"){
    el.classList.toggle("sel");
    cs[k]=[].map.call(el.parentNode.querySelectorAll(".sel"),function(b){return b.textContent||b.dataset.v;});
  }else{
    el.parentNode.querySelectorAll("button").forEach(function(b){b.classList.remove("sel");});
    el.classList.add("sel");
    cs[k]=v;
  }
  if(ci&&ci.cs===3){var extra=0;if(cs.cl)extra=0.5*cs.cl.length;var pe=document.getElementById("mp-m");if(pe)pe.textContent=(5+extra).toFixed(2).replace(".",",")+"€";}
}

function bindChips(container){container.querySelectorAll(".chips button").forEach(function(b){b.addEventListener("click",function(){sel(this.dataset.k,this.dataset.v,this);});});}

function om(id){
  var it=getItem(id);if(!it||!it.cs)return;
  ci=it;cs={};
  var mb=document.getElementById("mb");
  mb.innerHTML='<div class="cs"><h4>Cuisson</h4><div class="chips">'+CU.map(function(v){return'<button data-k="cu" data-v="'+v+'">'+v+'</button>';}).join("")+'</div></div><div class="cs"><h4>Viande</h4><div class="chips">'+VI.map(function(v){return'<button data-k="v" data-v="'+v+'">'+v+'</button>';}).join("")+'</div></div><div class="cs"><h4>Crudités</h4><div class="chips">'+CR.map(function(v){return'<button class="multi" data-k="r" data-v="'+v+'">'+v+'</button>';}).join("")+'</div></div><div class="cs"><h4>Suppléments</h4><div class="chips">'+SP.map(function(v){return'<button class="multi" data-k="p" data-v="'+v+'">'+v+'</button>';}).join("")+'</div></div><div class="cs"><h4>Sauce</h4><div class="chips">'+SA.map(function(v){return'<button data-k="s" data-v="'+v+'">'+v+'</button>';}).join("")+'</div></div>';
  document.getElementById("mp").textContent=it.p.toFixed(2)+"€";
  document.getElementById("mod").classList.add("on");
  document.body.style.overflow="hidden";
  document.getElementById("mi").value="";
  bindChips(mb);
}
function omc(id){var it=getItem(id);if(!it||!it.cs)return;pendingItem=it;om(id);}

function oti(){
  ci=getItem("t");cs={};
  var mb=document.getElementById("mb-t");
  mb.innerHTML='<div class="cs"><h4>Parfum</h4><div class="chips">'+TIR.map(function(v){return'<button data-k="ti" data-v="'+v+'">'+v+'</button>';}).join("")+'</div></div>';
  document.getElementById("mod-t").classList.add("on");
  document.body.style.overflow="hidden";
  bindChips(mb);
}

function omm(id){
  var it=getItem(id);if(!it||!it.cs)return;
  ci=it;cs={};
  var mb=document.getElementById("mb-m");
  mb.innerHTML='<div class="cs"><h4>Choix</h4><div class="chips">'+MSC.map(function(v){return'<button data-k="ch" data-v="'+v+'">'+v+'</button>';}).join("")+'</div></div><div class="cs"><h4>Coulis (+0,50€)</h4><div class="chips">'+MCL.map(function(v){return'<button class="multi" data-k="cl" data-v="'+v+'">'+v+'</button>';}).join("")+'</div></div>';
  var pe=document.getElementById("mp-m");
  if(pe)pe.textContent="5,00€";
  document.getElementById("mod-m").classList.add("on");
  document.body.style.overflow="hidden";
  document.getElementById("mi-m").value="";
  bindChips(mb);
}

function closeModals(){["mod","mod-t","mod-m","mod-pick"].forEach(function(id){var m=document.getElementById(id);if(m)m.classList.remove("on");});document.body.style.overflow="";ci=null;cs={};}
function cm(){closeModals();}function cmt(){closeModals();}function cmm(){closeModals();}

function showExtraPicker(){
  if(!pendingItem)return;
  var it=pendingItem,g=it.id==="g";
  var btns=DRINKS.map(function(d){return'<button class="ebtn" data-id="'+d.id+'">🥤 '+d.n+'</button>';}).join("");
  var html='<div class="cs"><h4>Choisis ta boisson</h4><div class="chips">'+btns+'</div></div>';
  document.getElementById("mb-pick").innerHTML=html;
  var me=document.getElementById("mb-pick");
  me.querySelectorAll(".ebtn").forEach(function(b){
    b.addEventListener("click",function(){
      var did=this.dataset.id;
      closeModals();
      pendingCust=" + "+getItem(did).n;
      if(g){
        oti();
      }else{
        addItemToCart(it);
      }
    });
  });
  document.getElementById("mod-pick").classList.add("on");document.body.style.overflow="hidden";
}

function addItemToCart(it){
  var label=it.n+(pendingCust||"");
  addItem(label,it.p,label);sv();
  if(pendingCust.indexOf("Dessert")>=0||pendingCust.indexOf("Tiramisu")>=0||pendingCust.indexOf("Milkshake")>=0)ts("Menu complet ajouté !");
  else if(pendingCust)ts("Menu avec boisson ajouté !");
  else ts(it.n+" ajouté !");
  pendingItem=null;pendingCust="";
}
function addItem(n,p,c){var idx=-1;for(var i=0;i<cart.length;i++){if(cart[i].n===n&&cart[i].cu===c){idx=i;break;}}if(idx>=0){cart[idx].q+=1;}else{cart.push({n:n,p:p,cu:c,q:1});}}

function ai(id){
  var it=getItem(id);if(!it)return;
  var idx=-1;
  for(var i=0;i<cart.length;i++){if(cart[i].n===it.n&&!cart[i].cu){idx=i;break;}}
  if(idx>=0){cart[idx].q+=1;}else{cart.push({n:it.n,p:it.p,cu:null,q:1});}
  sv();ts(it.n+" ajouté !");
}

function sv(){try{localStorage.setItem("c",JSON.stringify(cart));}catch(e){}uc();}
function cq(idx,d){try{cart[idx].q+=d;if(cart[idx].q<=0)cart.splice(idx,1);sv();}catch(e){}}

function getSubtotal(){var s=0;for(var i=0;i<cart.length;i++){s+=cart[i].p*cart[i].q;}return s;}
function getDelivery(){return cmdMode==="livraison"?DELIVERY_FEE:0;}
function getTotal(){return getSubtotal()+getDelivery();}

function uc(){
  var n=0,t=getTotal(),st=getSubtotal(),df=getDelivery();
  for(var i=0;i<cart.length;i++){n+=cart[i].q;}
  document.getElementById("cc").textContent=n;
  document.getElementById("c2").textContent=t.toFixed(2)+"€";
  var c=document.getElementById("ci");
  var stEl=document.querySelector(".cp-st");
  if(stEl)stEl.textContent=st.toFixed(2).replace(".",",")+"€";
  if(!cart.length){
    c.innerHTML='<div class="cp-em">Panier vide</div>';
    document.getElementById("ct-total").textContent="0,00€";
    var dr=document.querySelector(".cp-tr.df");
    if(dr)dr.style.display="none";
    return;
  }
  var dr=document.querySelector(".cp-tr.df");
  if(dr)dr.style.display=df>0?"flex":"none";
  if(df>0&&dr){(dr.querySelector(".df-val")||{}).textContent=df.toFixed(2).replace(".",",")+"€";}
  document.getElementById("ct-total").textContent=t.toFixed(2).replace(".",",")+"€";
  c.innerHTML=cart.map(function(i,idx){return'<div class="ci"><div class="ci-if"><h4>'+i.n+'</h4>'+(i.cu?'<div class="cu">'+i.cu.substring(0,50)+'</div>':"")+'<div class="up">'+i.p.toFixed(2)+'€</div></div><div class="ci-ac"><button class="ci-q" data-idx="'+idx+'" data-d="-1">−</button><span class="ci-n">'+i.q+'</span><button class="ci-q" data-idx="'+idx+'" data-d="1">+</button><span class="ci-it">'+(i.p*i.q).toFixed(2)+'€</span></div></div>';}).join("");
  c.querySelectorAll(".ci-q").forEach(function(x){x.addEventListener("click",function(){cq(parseInt(this.dataset.idx),parseInt(this.dataset.d));});});
}

function tc(){document.getElementById("co").classList.toggle("on");document.getElementById("cp").classList.toggle("on");document.body.style.overflow=document.getElementById("co").classList.contains("on")?"hidden":"";updateCartMode();setTimeout(function(){var a=document.getElementById("cp-address");if(a)a.style.display=cmdMode==="livraison"&&document.getElementById("cp").classList.contains("on")?"block":"none";},50);}
function ts(m,loading){var t=document.getElementById("toast"),s=document.getElementById("tm");if(loading){s.textContent=m;t.classList.add("on");clearTimeout(window._tt);return;}s.textContent=m;t.classList.add("on");clearTimeout(window._tt);window._tt=setTimeout(function(){t.classList.remove("on");},2500);}

// BIND
bindCards(document);
renderMenu("all",document.getElementById("mg"));
renderMenu("all",document.getElementById("mg2"));

document.querySelectorAll(".nv a").forEach(function(a){a.addEventListener("click",function(){navTo(this.id.replace("na-",""));});});
document.querySelector(".hero-btn").addEventListener("click",function(){navTo("menu");});
document.querySelector(".hero-btn2").addEventListener("click",function(){window.location.href="https://wa.me/33672044875";});

document.getElementById("nl1").addEventListener("submit",function(e){e.preventDefault();var v=this.querySelector("input");if(!v||!v.value.trim())return;var em=v.value.trim();v.disabled=true;var x=new XMLHttpRequest();x.open("POST","/api/newsletter",true);x.setRequestHeader("Content-Type","application/json");x.onload=function(){v.disabled=false;if(x.status===200){ts("Inscrit !");v.value="";}else{ts("Erreur");}};x.onerror=function(){v.disabled=false;ts("Erreur réseau");};x.send(JSON.stringify({email:em}));});
document.getElementById("nl2").addEventListener("submit",function(e){e.preventDefault();var v=this.querySelector("input");if(!v||!v.value.trim())return;var em=v.value.trim();v.disabled=true;var x=new XMLHttpRequest();x.open("POST","/api/newsletter",true);x.setRequestHeader("Content-Type","application/json");x.onload=function(){v.disabled=false;if(x.status===200){ts("Inscrit !");v.value="";}else{ts("Erreur");}};x.onerror=function(){v.disabled=false;ts("Erreur réseau");};x.send(JSON.stringify({email:em}));});

document.querySelectorAll(".tabs button").forEach(function(b){b.addEventListener("click",function(){var p=this.closest(".pg");p.querySelectorAll(".tabs button").forEach(function(x){x.classList.remove("on");});this.classList.add("on");renderMenu(this.dataset.c,document.getElementById(p.id==="acc"?"mg":"mg2"));});});

document.getElementById("cp-mode-livraison").addEventListener("click",function(){setMode("livraison");});
document.getElementById("cp-mode-emporter").addEventListener("click",function(){setMode("emporter");});
if(cmdMode==="livraison"){document.getElementById("cp-mode-livraison").className="on";}else{document.getElementById("cp-mode-emporter").className="on";}

document.getElementById("ct").addEventListener("click",tc);
document.getElementById("co").addEventListener("click",tc);
document.querySelector(".cp-x").addEventListener("click",tc);

document.getElementById("cp-pay-btn").addEventListener("click",function(){
  if(!cart.length)return;
  var btn=this;
  var name=(document.getElementById("pay-name-inline")||{}).value.trim()||"Client";
  var addr=cmdMode==="livraison"?(document.getElementById("cp-addr-input")||{}).value.trim()||cmdAddr:cmdAddr;
  if(cmdMode==="livraison"&&!addr){ts("📝 Ajoute ton adresse");document.getElementById("cp-addr-input").focus();return;}
  btn.textContent="💳 Traitement...";btn.disabled=true;
  var t=getTotal(),st=getSubtotal(),df=getDelivery();
  var items=cart.map(function(i){return{name:i.n,price:Math.round(i.p*100),qty:i.q,custom:i.cu||null};});
  if(df>0){items.push({name:"🚚 Livraison",price:Math.round(df*100),qty:1,custom:null});}
  var x=new XMLHttpRequest();
  x.open("POST","/api/create-checkout",true);
  x.setRequestHeader("Content-Type","application/json");
  x.onload=function(){btn.innerHTML="💳 Payer "+t.toFixed(2).replace(".",",")+"€";btn.disabled=false;if(x.status===200){var r=JSON.parse(x.responseText);if(r.url){window.location.href=r.url;}else{ts("Erreur paiement");}}else{ts("Erreur serveur");}};
  x.onerror=function(){btn.innerHTML="💳 Payer "+t.toFixed(2).replace(".",",")+"€";btn.disabled=false;ts("Erreur réseau");};
  x.send(JSON.stringify({items:items,total:t,customerName:name,mode:cmdMode,address:addr}));
});

document.querySelectorAll(".mod .mod-cl").forEach(function(b){b.addEventListener("click",function(){var m=this.closest(".mod");if(m){m.classList.remove("on");document.body.style.overflow="";ci=null;cs={};if(m.id==="mod")pendingItem=null;}});});
document.querySelectorAll(".mod").forEach(function(m){m.addEventListener("click",function(e){if(e.target===this){this.classList.remove("on");document.body.style.overflow="";ci=null;cs={};if(this.id==="mod")pendingItem=null;}});});

document.querySelector("#mod .mod-ok").addEventListener("click",function(){
  if(!ci||!cs.cu||!cs.v||!cs.s){ts("Choisis cuisson, viande et sauce");return;}
  var ins=document.getElementById("mi").value.trim();
  var t=(cs.cu||"")+"|"+(cs.v||"")+"|"+(cs.r?cs.r.join(","):"-")+(cs.p?"|"+cs.p.join(","):"")+"|"+(cs.s||"")+(ins?"|"+ins:"");
  if(pendingItem){cm();showExtraPicker();}
  else{addItem(ci.n,ci.p,t);sv();cm();ts(ci.n+" ajouté !");}
});

document.querySelector("#mod-t .mod-ok").addEventListener("click",function(){
  if(!cs.ti){ts("Choisis un parfum");return;}
  if(pendingCust){
    var fullLabel=pendingCust+" + Tiramisu ("+cs.ti+")";
    var it=pendingItem||ci;
    addItem(it.n+fullLabel,it.p,fullLabel);
    sv();ts("Menu complet ajouté !");
    pendingItem=null;pendingCust="";
    cmt();
  }else{
    addItem("Tiramisu - "+cs.ti,3,cs.ti);sv();
    ts("Tiramisu ajouté !");
    cmt();
  }
});

document.querySelector("#mod-m .mod-ok").addEventListener("click",function(){
  if(!cs.ch){ts("Choisis un type");return;}
  var ins=document.getElementById("mi-m").value.trim();
  var extra=0;if(cs.cl)extra=0.5*cs.cl.length;
  var msLabel=cs.ch+(cs.cl?"+"+cs.cl.join(","):"")+(ins?"|"+ins:"");
  if(pendingCust){
    var fullLabel=pendingCust+" + Milkshake ("+cs.ch+")";
    var it=pendingItem||ci;
    addItem(it.n+fullLabel,it.p+5+extra,fullLabel);
    sv();ts("Menu complet ajouté !");
    pendingItem=null;pendingCust="";
  }else{
    addItem(ci.n+" ("+cs.ch+")",5+extra,msLabel);sv();
    ts("Milkshake ajouté !");
  }
  cmm();
});

document.addEventListener("keydown",function(e){
  if(e.key==="Escape"){
    ["mod","mod-t","mod-m","mod-pick"].forEach(function(id){var m=document.getElementById(id);if(m&&m.classList.contains("on")){m.classList.remove("on");document.body.style.overflow="";ci=null;cs={};if(id==="mod")pendingItem=null;}});
    if(document.getElementById("cp").classList.contains("on"))tc();
  }
});

window.addEventListener("scroll",function(){document.getElementById("top-btn").style.display=window.scrollY>400?"flex":"none";});
document.getElementById("top-btn").addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});

(function(){var h=new Date().getHours();document.getElementById("nb").style.display=(h>=23||h<6)?"block":"none";document.getElementById("ni").style.display=(h>=23||h<6)?"flex":"none";})();
window.matchMedia("(prefers-color-scheme:dark)").addEventListener("change",function(e){if(!localStorage.getItem("t"))document.documentElement.dataset.theme=e.matches?"dark":"light";});
setInterval(function(){var h=new Date().getHours();document.getElementById("nb").style.display=(h>=23||h<6)?"block":"none";document.getElementById("ni").style.display=(h>=23||h<6)?"flex":"none";},60000);
var st=localStorage.getItem("t")||(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");document.documentElement.dataset.theme=st;

function tt(){var t=document.documentElement.dataset.theme,n=t==="dark"?"light":"dark";document.documentElement.dataset.theme=n;localStorage.setItem("t",n);}
document.getElementById("tt").addEventListener("click",tt);

function mh(){var m=document.getElementById("mn");m.classList.toggle("on");var h=document.getElementById("ham");if(h)h.textContent=m.classList.contains("on")?"✕":"☰";}
document.getElementById("ham").addEventListener("click",mh);
document.addEventListener("click",function(e){var m=document.getElementById("mn"),h=document.getElementById("ham");if(m&&m.classList.contains("on")&&!m.contains(e.target)&&!h.contains(e.target)){m.classList.remove("on");h.textContent="☰";}});

["acc","menu","ap","con"].forEach(function(p){var a=document.createElement("a");var names={acc:"Accueil",menu:"Menu",ap:"Infos",con:"Contact"};a.textContent=names[p];a.addEventListener("click",function(){navTo(p);var m=document.getElementById("mn");if(m)m.classList.remove("on");document.getElementById("ham").textContent="☰";});document.getElementById("mn").appendChild(a);});

document.getElementById("wa-btn").addEventListener("click",function(){window.location.href="https://wa.me/33672044875";});

if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js?v=2").catch(function(){});navigator.serviceWorker.ready.then(function(r){r.update();});}

(function(){
  var p=new URLSearchParams(window.location.search);
  
  
  if(p.get("payment")==="success"){
    var t=getTotal(),st=getSubtotal(),df=getDelivery();
    var mode=cmdMode==="livraison"?"LIVRAISON ["+cmdAddr+"]":"A EMPORTER";
    var items="";
    for(var i=0;i<cart.length;i++){
      items+=cart[i].q+"x "+cart[i].n+(cart[i].cu?" ("+cart[i].cu.substring(0,50)+")":"")+" - "+(cart[i].p*cart[i].q).toFixed(2)+"EUR\n";
    }
    if(df>0)items+="Livraison: "+df.toFixed(2)+"EUR\n";
    var total=t.toFixed(2);
    
    var msg="";
    msg+="*NOUVELLE COMMANDE (PAYEE)*\n";
    msg+="\n";
    msg+=mode+"\n";
    msg+="\n";
    msg+=items;
    msg+="\n";
    msg+="Total: "+total+" EUR\nPAYE OK";
var waUrl="https://wa.me/"+WA_NUMBERS[0]+"?text="+encodeURIComponent(msg);
    try{window.open(waUrl,"_blank");}catch(e){}
    cart=[];sv();tc();ts("Commande envoyee par WhatsApp !");
  }
;

})();
var initHash=window.location.hash.replace("#","");
if(initHash&&["acc","menu","ap","con"].indexOf(initHash)>=0)navTo(initHash);
updateCartMode();uc();
