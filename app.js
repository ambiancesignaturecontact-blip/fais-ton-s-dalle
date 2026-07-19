
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
    var mode=cmdMode==="livraison"?"Livraison ["+cmdAddr+"]":"À emporter";
    var its=cart.map(function(i){return i.q+"x "+i.n+(i.cu?" ("+i.cu.substring(0,50)+")":"")+" - "+(i.p*i.q).toFixed(2)+"€";}).join("%0a");
    if(df>0)its+="%0a🚚 Livraison: "+df.toFixed(2)+"€";
    var msg="NOUVELLE COMMANDE (PAYE)%0a%0a"+mode+"%0a%0a"+its+"%0a%0aTotal: "+t.toFixed(2)+"€%0aPAYE";
    var waUrl="https://wa.me/"+WA_NUMBERS[0]+"?text="+encodeURIComponent(msg);
    try{window.location.href=waUrl;}catch(e){}
    cart=[];sv();tc();ts("Commande envoyée !");
  }
})();


// ========== WOW EFFECTS ENGINE — MOBILE + DESKTOP ==========
(function(){
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var isMobile = isTouch || window.innerWidth < 768;
  
  // === 1. 3D TILT CARDS — MOUSE (desktop) + GYROSCOPE (mobile) ===
  (function(){
    var grids = document.querySelectorAll('.grid');
    if(!isTouch){
      // Desktop: Mouse tracking
      grids.forEach(function(grid){
        grid.addEventListener('mousemove',function(e){
          var cards = this.querySelectorAll('.crd');
          cards.forEach(function(card){
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left - rect.width/2;
            var y = e.clientY - rect.top - rect.height/2;
            var rotY = x/12;
            var rotX = -y/12;
            card.style.transform = 'translateY(-4px) rotateX('+rotX+'deg) rotateY('+rotY+'deg) translateZ(15px)';
            card.classList.add('crd-tilt');
          });
        });
        grid.addEventListener('mouseleave',function(){
          this.querySelectorAll('.crd').forEach(function(card){
            card.style.transform = '';
            card.classList.remove('crd-tilt');
          });
        });
      });
    } else {
      // Mobile: Subtle entrance animation sequence instead of tilt
      // Cards already have cardIn animation, add extra pop
      document.querySelectorAll('.crd').forEach(function(card, i){
        card.style.animation = 'cardIn .5s ease both';
        card.style.animationDelay = (i * 0.05) + 's';
      });
    }
  })();
  
  // === 2. MAGNETIC BUTTONS ===
  if(!isTouch){
    document.querySelectorAll('.hero-btn,.hero-btn2,.mod-ok,.cp-ck,.ub,.add-btn').forEach(function(btn){
      btn.addEventListener('mousemove',function(e){
        var rect = this.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width/2;
        var y = e.clientY - rect.top - rect.height/2;
        var dist = Math.sqrt(x*x + y*y);
        if(dist < 150){
          var strength = Math.max(0, 1 - dist/150) * 6;
          this.style.setProperty('--mx', (x/rect.width * strength) + 'px');
          this.style.setProperty('--my', (y/rect.height * strength) + 'px');
          this.style.transform = 'translate(calc(var(--mx,0px)),calc(var(--my,0px)))';
        }
      });
      btn.addEventListener('mouseleave',function(){
        this.style.transform = '';
        this.style.setProperty('--mx','0px');
        this.style.setProperty('--my','0px');
      });
    });
  } else {
    // Mobile: Add a quick scale pulse on touch instead
    document.querySelectorAll('.hero-btn,.hero-btn2,.mod-ok,.cp-ck,.ub,.add-btn').forEach(function(btn){
      btn.addEventListener('touchstart',function(){
        this.style.transition = 'transform .15s ease';
        this.style.transform = 'scale(.95)';
      });
      btn.addEventListener('touchend',function(){
        this.style.transform = 'scale(1)';
        setTimeout(function(){ this.style.transition = ''; }.bind(this), 200);
      });
    });
  }
  
  // === 3. RIPPLE + CONFETTI — MOBILE FRIENDLY ===
  document.querySelectorAll('.add-btn,.mod-ok,.cp-ck,.hero-btn').forEach(function(btn){
    btn.addEventListener('click', function(e){
      var clientX = e.clientX;
      var clientY = e.clientY;
      // Fallback for touch events
      if(!clientX && e.touches){ clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      if(!clientX && e.changedTouches){ clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; }
      // If still no clientX, use button center
      if(!clientX){
        var rect = this.getBoundingClientRect();
        clientX = rect.left + rect.width/2;
        clientY = rect.top + rect.height/2;
      }
      
      // Ripple wave
      var rect = this.getBoundingClientRect();
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      var rx = clientX - rect.left;
      var ry = clientY - rect.top;
      ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,.4);pointer-events:none;animation:rippleAnim .6s ease-out forwards;z-index:10;left:'+rx+'px;top:'+ry+'px';
      this.style.position = 'relative';
      this.appendChild(ripple);
      setTimeout(function(){ ripple.remove(); }, 700);
      
      // Confetti burst
      var emojis = ['🥪','🥩','🥗','🧀','🔥','✨','🎉','💥','👊','🍟'];
      var count = isMobile ? 6 : 10;
      for(var i = 0; i < count; i++){
        (function(){
          var el = document.createElement('div');
          el.className = 'confetti';
          el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
          el.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;animation:confettiFall linear forwards;left:'+(Math.random()*70+15)+'vw;top:'+(clientY)+'px;font-size:'+(Math.random()*0.6+0.8)+'rem;animation-duration:'+(Math.random()*1+0.8)+'s;animation-delay:'+(Math.random()*0.2)+'s';
          document.body.appendChild(el);
          setTimeout(function(){ el.remove(); }, 2500);
        })();
      }
    });
  });
  
  // === 4. HERO PARALLAX — MOBILE GYROSCOPE ===
  var hero = document.querySelector('.hero');
  if(hero){
    if(!isTouch){
      // Desktop: Mouse tracking
      hero.addEventListener('mousemove', function(e){
        var rect = this.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        this.querySelectorAll('.hero-particle').forEach(function(p, i){
          var speed = 8 + i * 5;
          p.style.transform = 'translate('+(x*speed)+'px,'+(y*speed)+'px)';
          p.style.transition = 'transform .5s ease-out';
        });
        // Also move content slightly
        var c = this.querySelector('.hero-c');
        if(c){ c.style.transform = 'translate('+(x*8)+'px,'+(y*8)+'px)'; c.style.transition = 'transform .5s ease-out'; }
      });
      hero.addEventListener('mouseleave', function(){
        this.querySelectorAll('.hero-particle').forEach(function(p){ p.style.transform = ''; });
        var c = this.querySelector('.hero-c');
        if(c){ c.style.transform = ''; }
      });
    } else {
      // Mobile: Auto-float animation (already present with heroFloat)
      // Add touch-based tilt using device orientation
      var hasOrientation = false;
      try {
        window.addEventListener('deviceorientation', function(e){
          if(e.gamma !== null){
            hasOrientation = true;
            var tiltX = Math.max(-0.5, Math.min(0.5, (e.gamma || 0) / 45));
            var tiltY = Math.max(-0.5, Math.min(0.5, (e.beta || 0) / 45 - 0.3));
            hero.querySelectorAll('.hero-particle').forEach(function(p, i){
              if(p.style.display !== 'none'){
                var speed = 4 + i * 3;
                p.style.transform = 'translate('+(tiltX*speed)+'px,'+(tiltY*speed)+'px)';
                p.style.transition = 'transform .8s ease-out';
              }
            });
          }
        }, { passive: true });
      } catch(e){}
      // Fallback if no orientation: particles already animate via floatUp
    }
  }
  
  
  // === 🎪 3D CARROUSEL HORIZONTAL ===
  (function(){
    // Grid optimisé — pas de carrousel
    // Les cartes ont déjà l'effet 3D tilt standard

    // No carousel - standard grid is better
    document.head.appendChild(style);
  })();


  // === 🔊 AUDIO FEEDBACK SYNTHe ===
  (function(){
    var audioCtx = null;
    function playTone(freq, duration, type, vol){
      try{
        if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        if(audioCtx.state === 'suspended') audioCtx.resume();
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol||0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration||0.3));
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + (duration||0.3));
      }catch(e){}
    }
    window.playSound = function(sound){
      switch(sound){
        case 'add': playTone(880,0.1,'sine',0.1); setTimeout(function(){playTone(1320,0.15,'sine',0.06)},80); break;
        case 'remove': playTone(440,0.15,'triangle',0.06); break;
        case 'success': playTone(660,0.1,'sine',0.08); setTimeout(function(){playTone(880,0.1,'sine',0.08)},100); setTimeout(function(){playTone(1100,0.15,'sine',0.08)},200); break;
        case 'click': playTone(600,0.05,'sine',0.04); break;
        case 'cart': playTone(440,0.08,'sine',0.06); setTimeout(function(){playTone(660,0.1,'sine',0.06)},80); break;
      }
    };
    // Hook into existing addItem
    var origAddItem = addItem;
    window.addItem = function(n,p,c){
      origAddItem(n,p,c);
      playSound('add');
    };
    // Hook into sv for cart total
    var origSv = sv;
    window.sv = function(){
      origSv();
    };
    // Hook into ts for toast
    var origTs = ts;
    window.ts = function(m){
      origTs(m);
      if(m.indexOf('ajouté')>=0||m.indexOf('complet')>=0) playSound('success');
      if(m.indexOf('Menu avec boisson')>=0) playSound('success');
    };
    // Button click sound
    document.querySelectorAll('.mod-ok,.cp-ck,.hero-btn,.ub').forEach(function(b){
      b.addEventListener('click',function(){playSound('click');});
    });
    document.getElementById('ct').addEventListener('click',function(){playSound('cart');});
  })();


  
  // === 🎭 HUMEUR DU SITE ===
  (function(){
    var moodEl = document.getElementById('mood');
    function updateMood(){
      var h = new Date().getHours();
      var mood, emoji, text;
      if(h >= 6 && h < 10){ mood='mood-dawn'; emoji='🌅'; text='Matinal'; }
      else if(h >= 10 && h < 14){ mood='mood-midday'; emoji='☀️'; text='Plein feu'; }
      else if(h >= 14 && h < 18){ mood='mood-eve'; emoji='😎'; text='Cool'; }
      else if(h >= 18 && h < 22){ mood='mood-eve'; emoji='🌆'; text='Soirée'; }
      else { mood='mood-night'; emoji='🌙'; text='Night Crew'; }
      document.body.classList.remove('mood-dawn','mood-midday','mood-eve','mood-night');
      document.body.classList.add(mood);
      if(moodEl) moodEl.innerHTML = emoji+' '+text;
    }
    updateMood();
    setInterval(updateMood, 60000);
  })();

  // === 🌙 NIGHT MODE AUTOMATIQUE ===
  (function(){
    function checkNight(){
      var h = new Date().getHours();
      var isNight = (h >= 22 || h < 6);
      document.body.classList.toggle('night-mode', isNight);
    }
    checkNight();
    setInterval(checkNight, 60000);
  })();


  // === 🌌 3D PARALLAX SCROLL ===
  (function(){
    if(isTouch) return;
    var scrollPos = 0;
    var hero = document.querySelector('.hero');
    var heroC = document.querySelector('.hero-c');
    var grids = document.querySelectorAll('.grid');
    var ticking = false;
    window.addEventListener('scroll', function(){
      scrollPos = window.scrollY;
      if(!ticking){
        requestAnimationFrame(function(){
          if(heroC) heroC.style.transform = 'translateY('+(scrollPos*0.06)+'px) translateZ(5px)';
          ticking = false;
        });
        ticking = true;
      }
    }, {passive: true});
  })();

  // === 5. 3D PAGE TRANSITION — ADAPTED FOR MOBILE ===
  var navLinks = document.querySelectorAll('.nv a, .mn a, .hero-btn[href*="#"]');
  navLinks.forEach(function(a){
    a.addEventListener('click', function(e){
      var href = this.getAttribute('href');
      if(!href || href.indexOf('#') !== 0) return;
      var target = href.replace('#', '');
      if(!target || ['acc','menu','ap','con'].indexOf(target) < 0) return;
      e.preventDefault();
      var targetEl = document.getElementById(target);
      if(!targetEl) return;
      
      var currentPg = null;
      document.querySelectorAll('.pg').forEach(function(pg){
        if(pg !== targetEl && !pg.classList.contains('h')){
          currentPg = pg;
          var tx = isMobile ? '-20px' : '-30px';
          var ry = isMobile ? '2deg' : '3deg';
          pg.style.transition = 'transform .35s cubic-bezier(.4,0,.2,1),opacity .35s';
          pg.style.transform = 'translateX('+tx+') rotateY('+ry+')';
          pg.style.opacity = '0';
          setTimeout(function(){
            pg.style.transform = ''; pg.style.opacity = ''; pg.classList.add('h');
          }, 350);
        }
      });
      
      targetEl.classList.remove('h');
      targetEl.style.transition = 'transform .35s cubic-bezier(.34,1.56,.64,1),opacity .35s';
      var tx2 = isMobile ? '20px' : '30px';
      var ry2 = isMobile ? '-2deg' : '-3deg';
      targetEl.style.transform = 'translateX('+tx2+') rotateY('+ry2+')';
      targetEl.style.opacity = '0';
      requestAnimationFrame(function(){
        targetEl.style.transform = 'translateX(0) rotateY(0deg)';
        targetEl.style.opacity = '1';
      });
      
      // Update nav
      document.querySelectorAll('.nv a').forEach(function(x){ x.classList.remove('sl'); });
      var navItem = document.getElementById('na-'+target);
      if(navItem) navItem.classList.add('sl');
      curPage = target;
      window.location.hash = target;
      
      // Close mobile menu
      var mn = document.getElementById('mn');
      if(mn) mn.classList.remove('on');
      var ham = document.getElementById('ham');
      if(ham) ham.textContent = '☰';
    });
  });
  
  // === 6. MOBILE-ONLY: SCROLL REVEAL ===
  if(isMobile){
    // Staggered entrance on scroll for cards
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.crd').forEach(function(card){
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity .5s ease, transform .5s ease';
      observer.observe(card);
    });
    
    // Also reveal review cards
    document.querySelectorAll('.rv-card').forEach(function(card){
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity .4s ease, transform .4s ease';
      observer.observe(card);
    });
    
    // Inf contact cards
    document.querySelectorAll('.inf div').forEach(function(card){
      card.style.opacity = '0';
      card.style.transform = 'translateY(15px)';
      card.style.transition = 'opacity .3s ease, transform .3s ease';
      observer.observe(card);
    });
  }
  
  // === 7. DESKTOP-ONLY: SMOOTH SCROLL FOR HASH CLICKS ===
  if(!isTouch){
    document.querySelectorAll('a[href*="#"]').forEach(function(a){
      a.addEventListener('click', function(e){
        var href = this.getAttribute('href');
        if(!href || href.indexOf('#') !== 0) return;
        var id = href.replace('#', '');
        var el = document.getElementById(id);
        if(el && !['acc','menu','ap','con'].includes(id)){
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
  
  // === 8. MOBILE: HAPTIC TOAST FEEDBACK ===
  if(isMobile){
    // Already handled by existing ts() function
    // Add vibration-like visual pulse to cart button on add
    var origAddItem = window.addItem;
    // Don't override, just enhance
  }
  

  // === 👆 CURSOR TRAIL — UNIQUE ===
  if(!isTouch){
    document.addEventListener('mousemove', function(e){
      var trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border-radius:50%;background:linear-gradient(135deg,#d43d2b,#e89f2e);box-shadow:0 0 20px rgba(212,62,43,.6),0 0 60px rgba(212,62,43,.2);animation:cursorFade .8s ease-out forwards;transform:translate(-50%,-50%)';
      trail.style.left = e.clientX + 'px';
      trail.style.top = e.clientY + 'px';
      trail.style.width = (Math.random()*6+4)+'px';
      trail.style.height = trail.style.width;
      trail.style.animation = 'cursorFade .8s ease-out forwards';
      document.body.appendChild(trail);
      setTimeout(function(){ trail.remove(); }, 800);
    });
  }
  
  // === 🃏 JOKER TAROT ===
  (function(){
    var tarots = [
      {icon:'🎡',title:'La Roue',desc:'La chance tourne ! -15% sur ta commande',badge:'-15%',cls:'discount'},
      {icon:'🃏',title:'Le Joker',desc:'Ingrédient surprise offert !',badge:'🧀 Gratuit',cls:'free'},
      {icon:'🌙',title:'La Lune',desc:'Mystère... offre mystère !',badge:'🎁 Surprise',cls:'free'},
      {icon:'☀️',title:'Le Soleil',desc:'Rayonnement divin ! Sandwich offert',badge:'☀️ 1 offert',cls:'free'},
    ];
    function addJokerBtn(){
      var ft = document.querySelector('.cp-ft');
      if(ft && !document.getElementById('joker-trigger') && cart.length > 0){
        var btn = document.createElement('button');
        btn.className = 'joker-btn-big';
        btn.id = 'joker-trigger';
        btn.innerHTML = '🃏 Tenter ma chance';
        btn.style.marginBottom = '10px';
        btn.addEventListener('click', function(){
          var pick = tarots[Math.floor(Math.random()*tarots.length)];
          document.getElementById('joker-icon').textContent = pick.icon;
          document.getElementById('joker-title').textContent = pick.title;
          document.getElementById('joker-desc').textContent = pick.desc;
          var badge = document.getElementById('joker-badge');
          badge.textContent = pick.badge;
          badge.className = 'joker-badge '+pick.cls;
          if(pick.cls==='discount'){
            var t=0;for(var i=0;i<cart.length;i++){t+=cart[i].p*cart[i].q;}
            localStorage.setItem('jokerDiscount', (t*0.15).toFixed(2));
          }
          if(pick.cls==='free') localStorage.setItem('freeSandwich','1');
          document.getElementById('mod-joker').classList.add('on');
        });
        ft.insertBefore(btn, ft.firstChild);
      }
    }
    var origTc = tc;
    tc = function(){
      origTc();
      setTimeout(addJokerBtn, 100);
    };
  })();
  
  // === 🌱 JARDIN DES INGRÉDIENTS ===
  (function(){
    var ICONS={'cu':'🔥','v':'🥩','r':'🥗','p':'🧀','s':'🥫','Tenders':'🍗','Emincé poulet':'🐔','Blanc dinde':'🦃','Jambon dinde':'🥓','Pastrami':'🥩','Rosette':'🍖','Thon':'🐟','Salade':'🥬','Tomate':'🍅','Concombre':'🥒','Oignons':'🧅','Poivrons':'🫑','Maïs':'🌽','Carottes râpées':'🥕','Avocat':'🥑','Cheddar':'🧀','Mozzarella':'🧀','Feta':'🧀','Mayo':'🫗','Ketchup':'🔴','Algérienne':'🟠','Samouraï':'🟡','Blanche':'⚪','Moutarde':'🟢','Brasil':'🔵','Chili':'🌶️','Thai':'🟣','Froid':'❄️','Chaud':'🔥'};
    function gi(n){return ICONS[n]||'🌿';}
    function uj(){
      var g=JSON.parse(localStorage.getItem('garden')||'{}');
      var gr=document.getElementById('jardin-grid'),el=document.getElementById('jardin');
      if(!gr||!el)return;
      var k=Object.keys(g);
      if(k.length===0){el.classList.remove('visible');return;}
      el.classList.add('visible');
      var it=k.sort(function(a,b){return g[b]-g[a];}),h='';
      for(var i=0;i<it.length&&i<20;i++){
        var n=it[i],c=g[n],l=c>=5?3:c>=2?2:1;
        h+='<div class="jardin-item level-'+l+'"><span class="ji-icon">'+gi(n)+'</span><span class="ji-count">×'+c+'</span><span class="ji-label">'+n.substring(0,10)+'</span></div>';
      }
      gr.innerHTML=h;
      document.getElementById('jardin-count').textContent=k.length;
      var t=0;for(var x in g)t+=g[x];
      var lv=t>=30?5:t>=20?4:t>=10?3:t>=5?2:1;
      document.getElementById('jardin-level').textContent=['Débutant','Apprenti','Chef','Maître','Légende'][lv-1]+' ⭐'.repeat(lv);
    }
    var oA=addItem;
    addItem=function(n,p,c){
      oA(n,p,c);
      if(c&&typeof c==='string'){c.split('|').forEach(function(p){p.split(',').forEach(function(i){var t=i.trim();if(t&&t!=='-'&&t.length<20){var g=JSON.parse(localStorage.getItem('garden')||'{}');g[t]=(g[t]||0)+1;localStorage.setItem('garden',JSON.stringify(g));}});});}
      if(n){var g=JSON.parse(localStorage.getItem('garden')||'{}');g[n.substring(0,15)]=(g[n.substring(0,15)]||0)+1;localStorage.setItem('garden',JSON.stringify(g));}
      uj();
    };
    setTimeout(uj,500);
    var oAi=ai;ai=function(id){oAi(id);uj();};
  })();
  

})();
var initHash=window.location.hash.replace("#","");
if(initHash&&["acc","menu","ap","con"].indexOf(initHash)>=0)navTo(initHash);
updateCartMode();uc();
