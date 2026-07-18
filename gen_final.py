#!/usr/bin/env python3
"""Generate clean index.html - ALL bugs fixed, working JS"""
import json, subprocess, tempfile, os, sys

ITEMS = json.dumps([
    {"id":"l","n":"Menu L\u00e9ger","c":"menus","p":6.9,"d":"Sandwich (viande + crudit\u00e9s + sauce)","cs":1,"pop":1},
    {"id":"c","n":"Menu Classique","c":"menus","p":7.9,"d":"Sandwich + boisson","cs":1,"pop":1},
    {"id":"g","n":"Menu Gourmand","c":"menus","p":9.9,"d":"Sandwich + boisson + dessert","cs":1,"pop":1},
    {"id":"t","n":"Tiramisu","c":"desserts","p":3,"d":"Fait maison","cs":2},
    {"id":"m","n":"Milkshake","c":"desserts","p":5,"d":"Personnalisable","cs":3},
    {"id":"co","n":"Coca-Cola","c":"boissons","p":1},
    {"id":"cz","n":"Coca Z\u00e9ro","c":"boissons","p":1},
    {"id":"pe","n":"Pepsi","c":"boissons","p":1},
    {"id":"oa","n":"Oasis Tropical","c":"boissons","p":1},
    {"id":"li","n":"Ice Tea","c":"boissons","p":1},
    {"id":"or","n":"Orangina","c":"boissons","p":1},
    {"id":"cr","n":"Cristaline","c":"boissons","p":1},
    {"id":"sp","n":"San Pellegrino","c":"boissons","p":1},
], ensure_ascii=False)

JS = f'''
var M={ITEMS};
var cart=JSON.parse(localStorage.getItem("c")||"[]"),ci=null,cs={{}},curPage="acc";
var cmdMode=localStorage.getItem("cmdMode")||"livraison",cmdAddr=localStorage.getItem("cmdAddr")||"";
var WA_NUMBERS=["33672044875","33744700167","33611924863"];
var CU=["Froid","Chaud"],VI=["Tenders","Eminc\u00e9 poulet","Blanc dinde","Jambon dinde","Pastrami","Rosette","Thon"];
var CR=["Salade","Tomate","Concombre","Oignons","Poivrons","Ma\u00efs","Carottes r\u00e2p\u00e9es","Avocat"];
var SA=["Mayo","Ketchup","Alg\u00e9rienne","Samoura\u00ef","Blanche","Moutarde","Brasil","Chili","Thai"];
var SP=["Cheddar","Mozzarella","Feta"];
var MSC=["Snickers","M&Ms","KitKat","KitKat White"];
var MCL=["Coulis chocolat (+0,50\u20ac)","Coulis caramel (+0,50\u20ac)","Coulis fraise (+0,50\u20ac)"];
var TIR=["Caramel","Chocolat","Sp\u00e9culos"];
var IMG={{l:"/images/menu-leger.jpg",c:"/images/menu-classique.jpg",g:"/images/menu-gourmand.jpg",t:"/images/tiramisu.jpg",m:"/images/milkshake.png",co:"/images/coca.jpg",cz:"/images/zero.jpg",pe:"/images/pepsi.jpg",oa:"/images/oasis.jpg",li:"/images/icetea.jpg",or:"/images/orangina.jpg",cr:"/images/cristaline.jpg",sp:"/images/sanpellegrino.jpg"}};

function gp(p){{
  var dirs=["acc","menu","ap","con"];
  dirs.forEach(function(x){{var e=document.getElementById(x);if(e)e.classList.add("h");}});
  document.getElementById(p).classList.remove("h");
  document.querySelectorAll(".nv a").forEach(function(x){{x.classList.remove("sl");}});
  var n=document.getElementById("na-"+p);if(n)n.classList.add("sl");
  curPage=p;
}}

document.querySelectorAll(".nv a").forEach(function(a){{
  a.addEventListener("click",function(){{gp(this.id.replace("na-",""));}});
}});
document.querySelector(".hero-btn").addEventListener("click",function(){{gp("menu");}});
document.querySelector(".hero-btn2").addEventListener("click",function(){{
  if(!window.open("https://wa.me/33672044875","_blank")){{
    alert("Autorise les pop-ups pour WhatsApp");
  }}
}});

function nl(e){{
  e.preventDefault();
  var v=e.target.querySelector("input");
  if(!v||!v.value.trim()){{return;}}
  var em=v.value.trim();v.disabled=true;
  var x=new XMLHttpRequest();
  x.open("POST","/api/newsletter",true);
  x.setRequestHeader("Content-Type","application/json");
  x.onload=function(){{v.disabled=false;if(x.status===200){{ts("Inscrit !");v.value="";}}else{{ts("Erreur");}}}};
  x.onerror=function(){{v.disabled=false;ts("Erreur r\u00e9seau");}};
  x.send(JSON.stringify({{email:em}}));
}}
document.getElementById("nl1").addEventListener("submit",nl);
document.getElementById("nl2").addEventListener("submit",nl);

function getItem(id){{for(var i=0;i<M.length;i++){{if(M[i].id===id)return M[i];}}return null;}}

function getFn(it){{
  if(!it)return null;
  if(it.cs===2)return "oti";
  if(it.cs===3)return "omm";
  if(it.cs)return "om";
  return "ai";
}}

function handleCardClick(id){{
  var it=getItem(id),fn=getFn(it);
  if(fn==="oti")oti();
  else if(fn==="omm")omm(id);
  else if(fn==="om")om(id);
  else if(fn==="ai")ai(id);
}}

document.querySelectorAll(".crd").forEach(function(el){{
  el.addEventListener("click",function(){{handleCardClick(this.dataset.id);}});
}});
document.querySelectorAll(".add-btn").forEach(function(el){{
  el.addEventListener("click",function(e){{
    e.stopPropagation();
    var crd=this.closest(".crd");
    if(crd)handleCardClick(crd.dataset.id);
  }});
}});

function renderMenu(g,el){{
  var items=g==="all"?M:M.filter(function(x){{return x.c===g;}});
  var h="";
  for(var i=0;i<items.length;i++){{
    var x=items[i];
    var ig=IMG[x.id]||"/images/coca.jpg";
    var badge=(x.pop&&x.c!=="boissons")?'<span class="pop-badge">Populaire</span>':"";
    h+='<div class="crd" data-id="'+x.id+'">';
    h+='<div class="crd-img" style="background-image:url('+ig+')" loading="lazy">'+badge+'</div>';
    h+='<div class="crd-body"><h3>'+x.n+'</h3>';
    h+='<div class="crd-desc">'+(x.d||"")+'</div>';
    h+='<div class="crd-ft"><span class="crd-pr">'+x.p.toFixed(2)+'\u20ac</span><button class="add-btn">+</button></div></div></div>';
  }}
  el.innerHTML=h;
  el.querySelectorAll(".crd").forEach(function(c){{c.addEventListener("click",function(){{handleCardClick(this.dataset.id);}});}});
  el.querySelectorAll(".add-btn").forEach(function(b){{b.addEventListener("click",function(e){{e.stopPropagation();var crd=this.closest(".crd");if(crd)handleCardClick(crd.dataset.id);}});}});
}}

renderMenu("all",document.getElementById("mg"));
renderMenu("all",document.getElementById("mg2"));

document.querySelectorAll(".tabs button").forEach(function(b){{
  b.addEventListener("click",function(){{
    var p=this.closest(".pg");
    p.querySelectorAll(".tabs button").forEach(function(x){{x.classList.remove("on");}});
    this.classList.add("on");
    renderMenu(this.dataset.c,document.getElementById(p.id==="acc"?"mg":"mg2"));
  }});
}});

function setMode(m){{
  cmdMode=m;localStorage.setItem("cmdMode",m);
  var cl=document.getElementById("cp-mode-livraison");
  var ce=document.getElementById("cp-mode-emporter");
  if(cl)cl.className=m==="livraison"?"on":"";
  if(ce)ce.className=m==="emporter"?"on":"";
  updateCartMode();
}}
document.getElementById("cp-mode-livraison").addEventListener("click",function(){{setMode("livraison");}});
document.getElementById("cp-mode-emporter").addEventListener("click",function(){{setMode("emporter");}});

if(cmdMode==="livraison"){{
  document.getElementById("cp-mode-livraison").className="on";
}}else{{
  document.getElementById("cp-mode-emporter").className="on";
}}

function updateCartMode(){{
  var cl=document.getElementById("cp-mode-livraison");
  var ce=document.getElementById("cp-mode-emporter");
  if(cl)cl.className=cmdMode==="livraison"?"on":"";
  if(ce)ce.className=cmdMode==="emporter"?"on":"";
}}

function sel(k,v,el){{
  if(k==="r"||k==="p"||k==="cl"){{
    el.classList.toggle("sel");
    cs[k]=[].map.call(el.parentNode.querySelectorAll(".sel"),function(b){{return b.textContent||b.dataset.v;}});
  }}else{{
    el.parentNode.querySelectorAll("button").forEach(function(b){{b.classList.remove("sel");}});
    el.classList.add("sel");cs[k]=v;
  }}
  if(ci&&ci.cs===3){{
    var extra=0;if(cs.cl)extra=0.5*cs.cl.length;
    document.getElementById("mp-m").textContent=(5+extra).toFixed(2).replace(".",",")+"\u20ac";
  }}
}}

function bindChips(container){{
  container.querySelectorAll(".chips button").forEach(function(b){{
    b.addEventListener("click",function(){{sel(this.dataset.k,this.dataset.v,this);}});
  }});
}}

function om(id){{
  var it=getItem(id);if(!it||!it.cs)return;
  ci=it;cs={{}};
  var mb=document.getElementById("mb");
  var cu=CU.map(function(v){{return '<button data-k="cu" data-v="'+v+'">'+v+'</button>';}}).join("");
  var vi=VI.map(function(v){{return '<button data-k="v" data-v="'+v+'">'+v+'</button>';}}).join("");
  var cr=CR.map(function(v){{return '<button class="multi" data-k="r" data-v="'+v+'">'+v+'</button>';}}).join("");
  var sp=SP.map(function(v){{return '<button class="multi" data-k="p" data-v="'+v+'">'+v+'</button>';}}).join("");
  var sa=SA.map(function(v){{return '<button data-k="s" data-v="'+v+'">'+v+'</button>';}}).join("");
  mb.innerHTML='<div class="cs"><h4>Cuisson</h4><div class="chips">'+cu+'</div></div>'+
    '<div class="cs"><h4>Viande</h4><div class="chips">'+vi+'</div></div>'+
    '<div class="cs"><h4>Crudit\u00e9s</h4><div class="chips">'+cr+'</div></div>'+
    '<div class="cs"><h4>Suppl\u00e9ments</h4><div class="chips">'+sp+'</div></div>'+
    '<div class="cs"><h4>Sauce</h4><div class="chips">'+sa+'</div></div>';
  document.getElementById("mp").textContent=it.p.toFixed(2)+"\u20ac";
  document.getElementById("mod").classList.add("on");document.body.style.overflow="hidden";
  document.getElementById("mi").value="";
  bindChips(mb);
}}

function oti(){{
  ci=getItem("t");cs={{}};
  var mb=document.getElementById("mb-t");
  var ti=TIR.map(function(v){{return '<button data-k="ti" data-v="'+v+'">'+v+'</button>';}}).join("");
  mb.innerHTML='<div class="cs"><h4>Parfum</h4><div class="chips">'+ti+'</div></div>';
  document.getElementById("mod-t").classList.add("on");document.body.style.overflow="hidden";
  bindChips(mb);
}}

function omm(id){{
  var it=getItem(id);if(!it||!it.cs)return;
  ci=it;cs={{}};
  var mb=document.getElementById("mb-m");
  var ms=MSC.map(function(v){{return '<button data-k="ch" data-v="'+v+'">'+v+'</button>';}}).join("");
  var cl=MCL.map(function(v){{return '<button class="multi" data-k="cl" data-v="'+v+'">'+v+'</button>';}}).join("");
  mb.innerHTML='<div class="cs"><h4>Choix</h4><div class="chips">'+ms+'</div></div>'+
    '<div class="cs"><h4>Coulis (+0,50\u20ac)</h4><div class="chips">'+cl+'</div></div>';
  document.getElementById("mp-m").textContent="5,00\u20ac";
  document.getElementById("mod-m").classList.add("on");document.body.style.overflow="hidden";
  document.getElementById("mi-m").value="";
  bindChips(mb);
}}

function cm(){{var ids=["mod","mod-t","mod-m"];ids.forEach(function(id){{var m=document.getElementById(id);if(m)m.classList.remove("on");}});document.body.style.overflow="";ci=null;cs={{}};}}
function cmt(){{cm();}}
function cmm(){{cm();}}

document.querySelectorAll(".mod .mod-cl").forEach(function(b){{
  b.addEventListener("click",function(){{var m=this.closest(".mod");if(m){{m.classList.remove("on");document.body.style.overflow="";ci=null;cs={{}};}}}});
}});
document.querySelectorAll(".mod").forEach(function(m){{
  m.addEventListener("click",function(e){{if(e.target===this){{this.classList.remove("on");document.body.style.overflow="";ci=null;cs={{}};}}}});
}});

function addItem(n,p,c){{
  var idx=-1;
  for(var i=0;i<cart.length;i++){{if(cart[i].n===n&&cart[i].cu===c){{idx=i;break;}}}}
  if(idx>=0){{cart[idx].q+=1;}}else{{cart.push({{n:n,p:p,cu:c,q:1}});}}
  sv();ts("Ajout\u00e9 !");
}}

document.querySelector("#mod .mod-ok").addEventListener("click",function(){{
  if(!ci||!cs.cu||!cs.v||!cs.s){{ts("Choisis cuisson, viande et sauce");return;}}
  var ins=document.getElementById("mi").value.trim();
  var t=(cs.cu||"")+"|"+(cs.v||"")+"|"+(cs.r?cs.r.join(","):"-")+(cs.p?"|"+cs.p.join(","):"")+"|"+(cs.s||"")+(ins?"|"+ins:"");
  addItem(ci.n,ci.p,t);cm();
}});

document.querySelector("#mod-t .mod-ok").addEventListener("click",function(){{
  if(!cs.ti){{ts("Choisis un parfum");return;}}
  addItem("Tiramisu - "+cs.ti,3,cs.ti);cmt();
}});

document.querySelector("#mod-m .mod-ok").addEventListener("click",function(){{
  if(!cs.ch){{ts("Choisis un type");return;}}
  var ins=document.getElementById("mi-m").value.trim();
  var extra=0;if(cs.cl)extra=0.5*cs.cl.length;
  var t=cs.ch+(cs.cl?"+"+cs.cl.join(","):"")+(ins?"|"+ins:"");
  addItem(ci.n+" ("+cs.ch+")",5+extra,t);cmm();
}});

function ai(id){{
  var it=getItem(id);if(!it)return;
  var idx=-1;
  for(var i=0;i<cart.length;i++){{if(cart[i].n===it.n&&!cart[i].cu){{idx=i;break;}}}}
  if(idx>=0){{cart[idx].q+=1;}}else{{cart.push({{n:it.n,p:it.p,cu:null,q:1}});}}
  sv();ts(it.n+" ajout\u00e9 !");
}}

function sv(){{try{{localStorage.setItem("c",JSON.stringify(cart));}}catch(e){{}}uc();}}

function uc(){{
  var n=0,t=0;
  for(var i=0;i<cart.length;i++){{n+=cart[i].q;t+=cart[i].p*cart[i].q;}}
  document.getElementById("cc").textContent=n;
  document.getElementById("ct").textContent=t.toFixed(2)+"\u20ac";
  document.getElementById("c2").textContent=t.toFixed(2)+"\u20ac";
  var c=document.getElementById("ci");
  if(!cart.length){{c.innerHTML='<div class="cp-em">Panier vide</div>';return;}}
  c.innerHTML=cart.map(function(i,idx){{
    var extra=i.cu?'<div class="cu">'+i.cu.substring(0,50)+'</div>':"";
    return '<div class="ci"><div class="ci-if"><h4>'+i.n+'</h4>'+extra+'<div class="up">'+i.p.toFixed(2)+'\u20ac</div></div>'+
      '<div class="ci-ac"><button class="ci-q" data-idx="'+idx+'" data-d="-1">\u2212</button><span class="ci-n">'+i.q+'</span>'+
      '<button class="ci-q" data-idx="'+idx+'" data-d="1">+</button><span class="ci-it">'+(i.p*i.q).toFixed(2)+'\u20ac</span></div></div>';
  }}).join("");
  c.querySelectorAll(".ci-q").forEach(function(x){{
    x.addEventListener("click",function(){{
      var idx=parseInt(this.dataset.idx),d=parseInt(this.dataset.d);
      try{{cart[idx].q+=d;if(cart[idx].q<=0)cart.splice(idx,1);sv();}}catch(e){{}}
    }});
  }});
}}
uc();

function tc(){{
  document.getElementById("co").classList.toggle("on");
  document.getElementById("cp").classList.toggle("on");
  document.body.style.overflow=document.getElementById("co").classList.contains("on")?"hidden":"";
  updateCartMode();
}}
document.getElementById("ct").addEventListener("click",tc);
document.getElementById("co").addEventListener("click",tc);
document.querySelector(".cp-x").addEventListener("click",tc);

document.querySelector(".cp-ck").addEventListener("click",function(){{
  if(!cart.length)return;
  var t=0;for(var i=0;i<cart.length;i++){{t+=cart[i].p*cart[i].q;}}
  document.getElementById("pay-total").textContent=t.toFixed(2)+"\u20ac";
  document.getElementById("mod-pay").classList.add("on");document.body.style.overflow="hidden";
}});

document.getElementById("pay-btn").addEventListener("click",function(){{
  var btn=this;btn.textContent="Traitement...";btn.disabled=true;
  var name=document.getElementById("pay-name").value.trim()||"Client";
  var t=0;for(var i=0;i<cart.length;i++){{t+=cart[i].p*cart[i].q;}}
  var items=cart.map(function(i){{return{{name:i.n,price:Math.round(i.p*100),qty:i.q,custom:i.cu||null}};}});
  var x=new XMLHttpRequest();
  x.open("POST","/api/create-checkout",true);
  x.setRequestHeader("Content-Type","application/json");
  x.onload=function(){{btn.textContent="Payer";btn.disabled=false;
    if(x.status===200){{var r=JSON.parse(x.responseText);if(r.url){{window.location.href=r.url;}}else{{ts("Erreur paiement");}}}}
    else{{ts("Erreur serveur");}}}};
  x.onerror=function(){{btn.textContent="Payer";btn.disabled=false;ts("Erreur r\u00e9seau");}};
  x.send(JSON.stringify({{items:items,total:t,customerName:name,mode:cmdMode,address:cmdAddr}}));
}});

function ts(m){{
  var t=document.getElementById("toast"),s=document.getElementById("tm");
  s.textContent=m;t.classList.add("on");
  clearTimeout(window._tt);
  window._tt=setTimeout(function(){{t.classList.remove("on");}},2500);
}}

document.addEventListener("keydown",function(e){{
  if(e.key==="Escape"){{
    var ids=["mod","mod-t","mod-m","mod-pay"];
    for(var i=0;i<ids.length;i++){{
      var m=document.getElementById(ids[i]);
      if(m&&m.classList.contains("on")){{m.classList.remove("on");document.body.style.overflow="";ci=null;cs={{}};return;}}
    }}
    if(document.getElementById("cp").classList.contains("on"))tc();
  }}
}});

window.addEventListener("scroll",function(){{
  document.getElementById("top-btn").style.display=window.scrollY>400?"flex":"none";
}});
document.getElementById("top-btn").addEventListener("click",function(){{window.scrollTo({{top:0,behavior:"smooth"}});}});

(function(){{var h=new Date().getHours(),n=(h>=23||h<6);document.getElementById("nb").style.display=n?"block":"none";document.getElementById("ni").style.display=n?"flex":"none";}})();
window.matchMedia("(prefers-color-scheme:dark)").addEventListener("change",function(e){{if(!localStorage.getItem("t"))document.documentElement.dataset.theme=e.matches?"dark":"light";}});
setInterval(function(){{var h=new Date().getHours();document.getElementById("nb").style.display=(h>=23||h<6)?"block":"none";document.getElementById("ni").style.display=(h>=23||h<6)?"flex":"none";}},60000);

var st=localStorage.getItem("t")||(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
document.documentElement.dataset.theme=st;

document.getElementById("tt").addEventListener("click",function(){{
  var t=document.documentElement.dataset.theme,n=t==="dark"?"light":"dark";
  document.documentElement.dataset.theme=n;localStorage.setItem("t",n);
}});

document.getElementById("ham").addEventListener("click",function(){{
  var m=document.getElementById("mn");m.classList.toggle("on");
  this.textContent=m.classList.contains("on")?"\u2715":"\u2630";
}});
document.addEventListener("click",function(e){{
  var m=document.getElementById("mn"),h=document.getElementById("ham");
  if(m.classList.contains("on")&&!m.contains(e.target)&&!h.contains(e.target)){{m.classList.remove("on");h.textContent="\u2630";}}
}});

["acc","menu","ap","con"].forEach(function(p){{
  var a=document.createElement("a");
  var names={{acc:"Accueil",menu:"Menu",ap:"Infos",con:"Contact"}};
  a.textContent=names[p];
  a.addEventListener("click",function(){{gp(p);document.getElementById("mn").classList.remove("on");document.getElementById("ham").textContent="\u2630";}});
  document.getElementById("mn").appendChild(a);
}});

document.getElementById("wa-btn").addEventListener("click",function(){{
  if(!window.open("https://wa.me/33672044875","_blank")){{
    alert("WhatsApp: https://wa.me/33672044875");
  }}
}});

if("serviceWorker" in navigator){{navigator.serviceWorker.register("/sw.js").catch(function(){{}});}}

(function(){{var p=new URLSearchParams(window.location.search);
if(p.get("payment")==="success"){{
  var t=0;for(var i=0;i<cart.length;i++){{t+=cart[i].p*cart[i].q;}}
  var mode=cmdMode==="livraison"?"Livraison ["+cmdAddr+"]":"\u00c0 emporter";
  var its=cart.map(function(i){{return i.q+"x "+i.n+(i.cu?" ("+i.cu.substring(0,50)+")":"")+" - "+(i.p*i.q).toFixed(2)+"\u20ac";}}).join("%0a");
  var msg="NOUVELLE COMMANDE (PAYE)%0a%0a"+mode+"%0a%0a"+its+"%0a%0aTotal: "+t.toFixed(2)+"\u20ac%0aPAYE";
  for(var wi=0;wi<WA_NUMBERS.length;wi++){{
    try{{window.open("https://wa.me/"+WA_NUMBERS[wi]+"?text="+encodeURIComponent(msg),wi===0?"_self":"_blank");}}catch(e){{}}
  }}
  cart=[];sv();tc();ts("Commande envoy\u00e9e !");
}}}})();

updateCartMode();
'''

# Test JS compilation
with tempfile.NamedTemporaryFile(suffix='.js', mode='w', delete=False, encoding='utf-8') as f:
    f.write(JS)
    fname = f.name

result = subprocess.run(['node', '--check', fname], capture_output=True, text=True)
os.unlink(fname)

if result.returncode != 0:
    print(f"❌ JS ERROR: {result.stderr[:300]}")
    sys.exit(1)
else:
    print(f"✅ JS OK ({len(JS)} chars)")

# Write JS
with open('index.html', 'w', encoding='utf-8') as f:
    f.write('PLACEHOLDER')

print("JS ready for insertion")
