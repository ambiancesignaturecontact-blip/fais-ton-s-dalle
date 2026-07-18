#!/usr/bin/env python3
import json, subprocess, tempfile, os, sys
sys.stdout.reconfigure(encoding='utf-8')

# ============================================================
# READ THE EXISTING JS (verified as working)
# ============================================================
with open('script_final.js', 'r', encoding='utf-8') as f:
    JS = f.read()

# ============================================================
# BUILD CSS (all styles, no duplicates, mobile header fixed)
# ============================================================
CSS = r''':root{--p:#c73b2b;--p2:#a52a1c;--s:#f5a623;--bg:#f8f6f3;--c:#fff;--t:#1a1a1a;--t2:#6b6b6b;--b:#e8e2db;--r:16px;--f:"Inter","Segoe UI",sans-serif;--sh:0 2px 16px rgba(0,0,0,.06);--sh2:0 8px 30px rgba(0,0,0,.1)}
[data-theme="dark"]{--bg:#121212;--c:#1a1a1a;--t:#eee;--t2:#999;--b:#2a2a2a}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;transition:background-color .25s,border-color .25s,color .25s}
html{scroll-behavior:smooth}
body{font-family:var(--f);background:var(--bg);color:var(--t);overflow-x:hidden;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block;height:auto}
a{color:inherit;text-decoration:none}
button,input,textarea{font-family:var(--f);cursor:pointer}
.bar{background:#1a1a1a;color:#fff;padding:5px 14px;padding-top:calc(5px + env(safe-area-inset-top,0px));font-size:.65rem;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;font-weight:600}
.bar .n{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#c7d2fe;padding:2px 10px;border-radius:12px;font-size:.55rem}
.h-badge{background:linear-gradient(135deg,#059669,#047857);color:#d1fae5;padding:2px 10px;border-radius:12px;font-size:.55rem}
.pg{display:block;animation:fadeIn .25s ease;padding-bottom:20px}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.pg.h{display:none}
header{background:rgba(255,255,255,.95);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);position:-webkit-sticky;position:sticky;top:0;z-index:100;border-bottom:1px solid var(--b)}
[data-theme="dark"] header{background:rgba(26,26,26,.95);border-bottom-color:#2a2a2a}
.hd{max-width:1100px;margin:0 auto;padding:0 16px;display:flex;align-items:center;justify-content:space-between;height:56px}
.lg{display:flex;align-items:center;gap:10px;color:#1a1a1a}
.lg img{height:30px;width:auto;border-radius:4px}
.br{font-weight:700;font-size:.85rem;color:#1a1a1a;line-height:1.2}
.br .sub{display:block;font-weight:500;font-size:.42rem;letter-spacing:1.2px;text-transform:uppercase;color:#1a1a1a;opacity:.5}
[data-theme="dark"] .br{color:#eee}[data-theme="dark"] .br .sub{color:#eee}[data-theme="dark"] .lg{color:#eee}
@media(min-width:769px){.br .sub{display:block}}
.nv{display:flex;gap:2px;align-items:center}
.nv a{padding:8px 14px;border-radius:30px;font-size:.72rem;font-weight:600;color:var(--t2);cursor:pointer;min-height:44px;display:flex;align-items:center}
.nv a:hover{background:var(--bg);color:var(--p)}
.nv a.sl{background:var(--p);color:#fff}
.tg{background:none;border:1.5px solid var(--b);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.85rem;color:var(--t2);min-width:44px;min-height:44px}
.tg:hover{border-color:var(--s);transform:rotate(15deg)}
.ct{padding:7px 12px;border-radius:30px;display:flex;align-items:center;gap:5px;font-weight:700;font-size:.72rem;cursor:pointer;border:1.5px solid var(--b);background:var(--c);min-height:44px}
.ct:hover{border-color:var(--p)}
.cb{background:var(--p);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.58rem;font-weight:700}
.ham{display:none;background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--t2);min-width:44px;min-height:44px;align-items:center;justify-content:center}
.mn{display:none;position:fixed;top:56px;left:0;right:0;background:var(--c);z-index:99;flex-direction:column;box-shadow:0 8px 30px rgba(0,0,0,.1);border-bottom:1px solid var(--b)}
.mn.on{display:flex}.mn a{padding:14px 20px;font-weight:600;font-size:.82rem;color:var(--t2);border-bottom:1px solid var(--b);cursor:pointer}
.mn a:hover{background:var(--bg);color:var(--p)}[data-theme="dark"] .mn{background:#1a1a1a;border-bottom-color:#2a2a2a}[data-theme="dark"] .mn a{color:#bbb}
.hero{background:linear-gradient(135deg,#1a1a1a,#2d2d2d);color:#fff;padding:48px 16px 40px;text-align:center;position:relative;overflow:hidden}
.hero-c{position:relative;max-width:620px;margin:0 auto;z-index:1}
.hero-badge{display:inline-block;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);padding:5px 16px;border-radius:30px;font-size:.6rem;margin-bottom:14px}
.hero h1{font-size:clamp(1.5rem,5vw,2.4rem);font-weight:900;margin-bottom:8px;letter-spacing:-.5px}
.hero h1 .h{background:linear-gradient(135deg,var(--s),#fbc96a);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-p{font-size:.78rem;opacity:.75;margin-bottom:22px}
.hero-acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.hero-btn{background:var(--p);color:#fff;padding:11px 28px;border-radius:30px;font-weight:700;font-size:.78rem;cursor:pointer;transition:all .25s;display:inline-block}
.hero-btn:hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(199,59,43,.25)}
.hero-btn2{background:rgba(255,255,255,.1);color:#fff;padding:11px 28px;border-radius:30px;font-weight:600;font-size:.78rem;cursor:pointer;border:1px solid rgba(255,255,255,.1);display:inline-block;transition:all .25s}
.hero-btn2:hover{background:rgba(255,255,255,.15);transform:translateY(-2px)}
.hero-particles{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.hero-particle{position:absolute;font-size:clamp(1rem,3vw,1.8rem);opacity:0;bottom:-30px;animation:floatUp 8s ease-in-out infinite}
.hero-particle:nth-child(1){left:5%;animation-delay:0s;animation-duration:9s}
.hero-particle:nth-child(2){left:25%;animation-delay:2s;animation-duration:11s}
.hero-particle:nth-child(3){left:50%;animation-delay:4s;animation-duration:8s}
.hero-particle:nth-child(4){left:78%;animation-delay:1s;animation-duration:10s}
@keyframes floatUp{0%{opacity:0;transform:translateY(60px)}10%{opacity:.6}90%{opacity:.4}100%{opacity:0;transform:translateY(-250px) rotate(360deg)}}
.nb{background:linear-gradient(135deg,#1e1b4b,#312e81);padding:7px 14px;text-align:center;color:#c7d2fe;display:none}
.w{max-width:1100px;margin:0 auto;padding:0 16px}
.sec{font-size:1.15rem;font-weight:700;margin:28px 0 4px;padding-bottom:8px;border-bottom:2px solid rgba(245,166,35,.2)}
.hl{color:var(--p)}
.tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 16px}
.tabs button{padding:8px 20px;border-radius:30px;border:1.5px solid var(--b);background:var(--c);font-weight:600;font-size:.68rem;cursor:pointer;white-space:nowrap;color:var(--t2);flex-shrink:0;transition:all .2s}
.tabs button:hover{border-color:var(--s)}.tabs button.on{background:var(--p);color:#fff;border-color:var(--p)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin-bottom:28px}
.crd{background:var(--c);border-radius:var(--r);overflow:hidden;border:1px solid var(--b);cursor:pointer;transition:all .3s ease;box-shadow:var(--sh);animation:cardIn .4s ease both}
.crd:nth-child(2){animation-delay:.05s}.crd:nth-child(3){animation-delay:.1s}.crd:nth-child(4){animation-delay:.15s}.crd:nth-child(5){animation-delay:.2s}.crd:nth-child(6){animation-delay:.25s}.crd:nth-child(7){animation-delay:.3s}.crd:nth-child(8){animation-delay:.35s}.crd:nth-child(9){animation-delay:.4s}.crd:nth-child(10){animation-delay:.45s}.crd:nth-child(11){animation-delay:.5s}.crd:nth-child(12){animation-delay:.55s}.crd:nth-child(13){animation-delay:.6s}
@keyframes cardIn{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.crd:hover{transform:translateY(-4px);box-shadow:var(--sh2);border-color:rgba(199,59,43,.2)}
.crd-img{width:100%;height:190px;background-size:cover;background-position:center;background-color:var(--b);position:relative}
.pop-badge{position:absolute;top:8px;left:8px;background:var(--s);color:#fff;padding:3px 10px;border-radius:30px;font-size:.5rem;font-weight:700;z-index:2}
.crd-body{padding:14px 16px 16px}.crd-body h3{font-size:.9rem;font-weight:700;margin-bottom:3px;color:var(--t)}
.crd-desc{color:var(--t2);font-size:.66rem;margin-bottom:10px}.crd-ft{display:flex;align-items:center;justify-content:space-between}
.crd-pr{font-weight:800;font-size:1.05rem;color:var(--p);background:rgba(199,59,43,.08);padding:2px 10px;border-radius:20px;display:inline-block}
.add-btn{background:var(--p);color:#fff;border:none;width:36px;height:36px;border-radius:50%;font-size:1.3rem;display:flex;align-items:center;justify-content:center;cursor:pointer}
.add-btn:hover{background:var(--p2);transform:scale(1.12)}
.rv{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:28px}
.rv-card{background:var(--c);border-radius:var(--r);padding:16px;border:1px solid var(--b)}
.rv-stars{color:#f5a623;font-size:.82rem;margin-bottom:4px}.rv-txt{font-size:.7rem;color:var(--t2);font-style:italic;margin-bottom:4px}.rv-auth{font-size:.65rem;font-weight:600}
.ap{max-width:680px;margin:0 auto;padding:20px 0}
.cd{background:var(--c);border-radius:var(--r);padding:18px 22px;margin:14px 0;border:1px solid var(--b);box-shadow:var(--sh)}
.ap h2{font-size:1.15rem;font-weight:700;margin-bottom:10px}.ap h3{font-size:.85rem;font-weight:700;color:var(--p);margin-bottom:6px}.ap p{color:var(--t2);font-size:.76rem;line-height:1.6}
.store-img{width:100%;max-height:220px;object-fit:cover;border-radius:var(--r);margin-bottom:16px;border:1px solid var(--b)}
.ap-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:16px 0}
.ap-gallery img{width:100%;height:100px;object-fit:cover;border-radius:var(--r);border:1px solid var(--b);cursor:pointer;transition:all .3s ease}
.ap-gallery img:hover{transform:scale(1.04)}
.inf{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:28px 0}
.inf div{background:var(--c);padding:16px;border-radius:var(--r);border:1px solid var(--b)}
.inf h3{font-weight:700;font-size:.76rem;margin-bottom:4px}.inf p{color:var(--t2);font-size:.66rem}
.cmd-toggle{display:flex;gap:8px;background:var(--b);border-radius:var(--r);padding:4px;max-width:360px;margin-bottom:16px}
.cmd-toggle button{flex:1;padding:10px 16px;border:none;border-radius:12px;background:transparent;font-weight:600;font-size:.78rem;color:var(--t2);cursor:pointer}
.cmd-toggle button.on{background:var(--p);color:#fff}.cmd-addr{margin-bottom:16px;max-width:480px}
.cp-mode-inline{padding:8px 20px;border-bottom:1px solid var(--b)}.cp-mode-inline .cmd-toggle{margin-bottom:0;max-width:100%}
.mod-ta{width:100%;padding:10px 14px;border:1.5px solid var(--b);border-radius:12px;font-size:.72rem;font-family:var(--f);color:var(--t);background:var(--c);resize:none;outline:none}
.mod-ta:focus{border-color:var(--p)}
.ub{background:#06c;color:#fff;padding:9px 20px;border-radius:30px;font-weight:700;font-size:.72rem;display:inline-block;cursor:pointer;border:none;transition:all .2s}
.ub:hover{transform:translateY(-1px)}.ub2{background:var(--p);color:#fff;padding:12px 28px;border-radius:30px;font-weight:700;font-size:.8rem;display:inline-block;cursor:pointer;transition:all .2s}.ub2:hover{transform:translateY(-2px)}
.nl{background:linear-gradient(135deg,var(--p),#8a2216);border-radius:var(--r);padding:24px;color:#fff;text-align:center;margin-bottom:28px;position:relative;overflow:hidden}
.nl h3{font-size:.95rem;font-weight:700;margin-bottom:3px}.nl p{opacity:.8;font-size:.72rem;margin-bottom:12px}.nl form{display:flex;gap:6px;max-width:300px;margin:0 auto}
.nl input{flex:1;padding:11px 16px;border-radius:30px;border:none;font-size:.75rem;outline:none}
.nl button{padding:11px 22px;background:#fff;color:var(--p);border:none;border-radius:30px;font-weight:700;font-size:.75rem;cursor:pointer}
.mod{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);z-index:200;align-items:center;justify-content:center;padding:14px}
.mod.on{display:flex}.mod-bx{background:var(--c);border-radius:var(--r);max-width:460px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 80px rgba(0,0,0,.2)}
.mod-hd{padding:16px 20px 12px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--c)}
.mod-hd h2{font-size:.82rem;font-weight:700}
.mod-cl{background:var(--b);border:none;width:28px;height:28px;border-radius:50%;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--t2);transition:all .2s}
.mod-cl:hover{background:var(--p);color:#fff;transform:rotate(90deg)}
.mod-bd{padding:14px 20px 10px}.cs{margin-bottom:16px}.cs h4{font-size:.75rem;font-weight:700;margin-bottom:5px;color:var(--t)}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chips button{padding:6px 14px;border:1.5px solid var(--b);border-radius:20px;background:var(--c);cursor:pointer;font-size:.63rem;font-weight:500;color:var(--t)}
.chips button:hover{border-color:var(--s)}.chips button.sel{border-color:var(--p);background:rgba(199,59,43,.08);color:var(--p);font-weight:600}
.chips button.sel::before{content:"\u2713";font-size:.5rem;margin-right:2px}
.mod-inst{padding:4px 20px 14px}.mod-ft{padding:12px 20px 14px;border-top:1px solid var(--b);display:flex;justify-content:space-between;align-items:center;background:var(--c);position:sticky;bottom:0}
.mod-pr{font-weight:800;font-size:1rem;color:var(--p)}
.mod-ok{background:var(--p);color:#fff;border:none;padding:9px 24px;border-radius:30px;font-weight:700;font-size:.74rem;cursor:pointer;transition:all .2s}
.mod-ok:hover{background:var(--p2);transform:scale(1.04)}
.co{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);z-index:300}.co.on{display:block}
.cp{position:fixed;top:0;right:-380px;width:380px;max-width:100vw;height:100vh;background:var(--c);z-index:301;transition:right .35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;box-shadow:-4px 0 30px rgba(0,0,0,.1)}
.cp.on{right:0}.cp-hd{padding:16px 20px;border-bottom:1px solid var(--b);display:flex;justify-content:space-between;align-items:center}
.cp-hd h3{font-size:.82rem;font-weight:700}
.cp-x{background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--t2);padding:4px;transition:all .2s}
.cp-x:hover{color:var(--p);transform:rotate(90deg)}
.cp-its{flex:1;overflow-y:auto;padding:8px 20px}.cp-em{text-align:center;padding:40px 0;color:var(--t2);font-size:.8rem}
.ci{display:flex;gap:8px;padding:10px 0;border-bottom:1px solid var(--b)}.ci:last-child{border:none}
.ci-if{flex:1;min-width:0}.ci-if h4{font-size:.75rem;font-weight:600}
.ci-if .cu{font-size:.6rem;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ci-if .up{font-size:.58rem;color:var(--t2)}
.ci-ac{display:flex;align-items:center;gap:6px;flex-shrink:0}
.ci-q{width:24px;height:24px;border-radius:50%;border:1.5px solid var(--b);background:var(--c);cursor:pointer;font-weight:700;font-size:.78rem;display:flex;align-items:center;justify-content:center;color:var(--t)}
.ci-q:hover{border-color:var(--p);color:var(--p);background:rgba(199,59,43,.04)}
.ci-n{font-weight:600;min-width:16px;text-align:center;font-size:.75rem}.ci-it{font-weight:700;color:var(--p);min-width:40px;text-align:right;font-size:.75rem}
.cp-ft{padding:12px 20px 16px;border-top:1px solid var(--b)}
.cp-tr{display:flex;justify-content:space-between;font-weight:700;font-size:.82rem;margin-bottom:8px}.cp-ta{color:var(--p)}
.cp-ck{width:100%;padding:12px;background:var(--p);color:#fff;border:none;border-radius:30px;font-weight:700;font-size:.76rem;cursor:pointer;transition:all .2s}
.cp-ck:hover{background:var(--p2)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:#1a1a1a;color:#fff;padding:12px 22px;border-radius:12px;font-size:.74rem;z-index:500;opacity:0;transition:all .4s cubic-bezier(.4,0,.2,1);pointer-events:none}
[data-theme="dark"] .toast{background:#333}.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.ni{display:none;position:fixed;bottom:16px;right:16px;z-index:50;background:linear-gradient(135deg,#1e1b4b,#312e81);color:#c7d2fe;padding:10px 14px;border-radius:12px;font-size:.6rem;font-weight:600;gap:6px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,.15)}
#top-btn{display:none;position:fixed;bottom:64px;right:14px;z-index:50;width:40px;height:40px;border-radius:50%;background:var(--p);color:#fff;border:none;font-size:1.2rem;cursor:pointer;box-shadow:0 2px 12px rgba(199,59,43,.25);transition:all .2s}
#top-btn:hover{transform:scale(1.12)}
footer{background:#1a1a1a;color:rgba(255,255,255,.6);padding:32px 16px 14px;margin-top:32px}[data-theme="dark"] footer{background:#0d0d0d}
.fi{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px}
.fi h4{color:#fff;font-weight:700;font-size:.74rem;margin-bottom:6px}
.fi p,.fi a{font-size:.66rem;color:rgba(255,255,255,.45);display:block;margin-bottom:4px}
.fi a:hover{color:var(--s)}
.fb{max-width:1100px;margin:14px auto 0;padding-top:12px;border-top:1px solid rgba(255,255,255,.06);text-align:center;font-size:.6rem}

[data-theme="dark"] .crd{background:#1a1a1a}[data-theme="dark"] .mod-bx{background:#1a1a1a}[data-theme="dark"] .mod-hd{background:#1a1a1a}[data-theme="dark"] .mod-ft{background:#1a1a1a}[data-theme="dark"] .inf div{background:#1a1a1a}[data-theme="dark"] .rv-card{background:#1a1a1a}[data-theme="dark"] .cd{background:#1a1a1a}[data-theme="dark"] .cp{background:#1a1a1a}[data-theme="dark"] .nl input{background:#2a2a2a;color:#eee}[data-theme="dark"] .mod-ta{background:#2a2a2a;color:#eee}[data-theme="dark"] .bar{background:#0d0d0d}[data-theme="dark"] .chips button{background:#1a1a1a}[data-theme="dark"] .chips button.sel{color:#fff}[data-theme="dark"] .ap-card{background:#1a1a1a}[data-theme="dark"] .ap-story{background:#1a1a1a}[data-theme="dark"] .ap-card-sm{background:#1a1a1a}[data-theme="dark"] .ap-card-info{background:#1a1a1a}

.ap-hero{background:linear-gradient(135deg,#1a1a1a,#2d2d2d);color:#fff;text-align:center;padding:40px 20px}
.ap-hero h1{font-size:clamp(1.3rem,4vw,2rem);font-weight:900;letter-spacing:-.5px;margin-bottom:6px}
.ap-hero h1 .h{background:linear-gradient(135deg,var(--s),#fbc96a);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.ap-hero p{opacity:.7;font-size:.78rem}
.ap-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin:16px 0 28px}
.ap-card{background:var(--c);border-radius:var(--r);padding:22px;border:1px solid var(--b);box-shadow:var(--sh);transition:all .3s ease}
.ap-card:hover{transform:translateY(-3px);box-shadow:var(--sh2)}
.ap-icon{font-size:2rem;margin-bottom:8px}.ap-card h3{font-size:.85rem;font-weight:700;margin-bottom:6px;color:var(--t)}
.ap-card p{font-size:.72rem;color:var(--t2);line-height:1.55}
.ap-story{background:var(--c);border-radius:var(--r);padding:24px 28px;margin:16px 0 28px;border:1px solid var(--b);box-shadow:var(--sh);line-height:1.8}
.ap-story p{font-size:.76rem;color:var(--t2);margin-bottom:12px}
.ap-story p:last-child{margin-bottom:0}
.ap-card-sm{background:var(--c);border-radius:var(--r);padding:16px 20px;border:1px solid var(--b)}
.ap-card-sm h3{font-size:.78rem;font-weight:700;margin-bottom:4px;color:var(--t)}
.ap-card-sm p{font-size:.68rem;color:var(--t2);line-height:1.5}
.ap-card-info{background:var(--c);border-radius:var(--r);padding:20px;border:1px solid var(--b)}
.ap-card-info h3{font-size:.78rem;font-weight:700;margin-bottom:6px;color:var(--t)}
.ap-card-info p{font-size:.72rem;color:var(--t2);line-height:1.5}
.ap-icon-sm{font-size:1.3rem;margin-bottom:4px}

::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:var(--b);border-radius:3px}

@media(max-width:1024px){.grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}}
@media(max-width:768px){.ham{display:flex}.nv a:not(.sl):not(.ham){display:none}.hd{height:48px;padding:0 8px}.lg{gap:6px}.lg img{height:24px}.br{font-size:.72rem}.br .sub{display:none}.nv{gap:0}.ham{min-width:36px;min-height:36px;font-size:1rem}.tg{min-width:36px;min-height:36px;font-size:.75rem}.ct{padding:5px 8px;min-height:36px;font-size:.68rem;gap:3px}.grid{grid-template-columns:1fr;max-width:420px}.cp{width:100vw;right:-100vw}.tabs button{padding:7px 16px}.crd-img{height:170px}.hero{padding:36px 14px 32px}.inf{grid-template-columns:1fr 1fr}.ap-gallery{grid-template-columns:1fr 1fr;gap:6px}.ap-gallery img{height:80px}.mod-bx{max-width:95vw}.fi{grid-template-columns:1fr 1fr}.ap-grid{grid-template-columns:1fr}.ap-story{padding:18px 20px}.ap-hero{padding:32px 16px}}
@media(max-width:480px){.hd{height:44px;padding:0 6px}.lg img{height:20px}.br{font-size:.65rem}.br .sub{display:none}.ham{min-width:32px;min-height:32px;font-size:.85rem}.tg{min-width:32px;min-height:32px;font-size:.65rem}.ct{padding:4px 6px;min-height:32px;font-size:.62rem;gap:3px}.cb{width:16px;height:16px;font-size:.5rem}.ham{display:flex}.crd-img{height:150px}.crd-body{min-height:75px}.hero h1{font-size:clamp(1.2rem,7vw,1.5rem)}.hero{padding:28px 10px 26px}.inf{grid-template-columns:1fr}.fi{grid-template-columns:1fr}.hero-btn,.hero-btn2{width:100%}.hero-acts{flex-direction:column}.hero-particle{display:none}.add-btn{width:32px;height:32px;font-size:1.1rem}.ap-grid{grid-template-columns:1fr}.ap-card{padding:16px}}
'''

# Verify CSS balance
c_o = CSS.count('{')
c_c = CSS.count('}')
print(f"✅ CSS braces: {c_o}/{c_c} {'OK' if c_o==c_c else 'MISMATCH!'}")

# ============================================================
# BUILD FULL HTML
# ============================================================
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

def item_card(item):
    badge = '<span class="pop-badge">Populaire</span>' if item.get('pop') and item.get('c')!='boissons' else ''
    img = {'l':'/images/menu-leger.jpg','c':'/images/menu-classique.jpg','g':'/images/menu-gourmand.jpg','t':'/images/tiramisu.jpg','m':'/images/milkshake.png','co':'/images/coca.jpg','cz':'/images/zero.jpg','pe':'/images/pepsi.jpg','oa':'/images/oasis.jpg','li':'/images/icetea.jpg','or':'/images/orangina.jpg','cr':'/images/cristaline.jpg','sp':'/images/sanpellegrino.jpg'}[item['id']]
    return f'<div class="crd" data-id="{item["id"]}"><div class="crd-img" style="background-image:url({img})" loading="lazy">{badge}</div><div class="crd-body"><h3>{item["n"]}</h3><div class="crd-desc">{item.get("d","")}</div><div class="crd-ft"><span class="crd-pr">{item["p"]:.2f}\u20ac</span><button class="add-btn">+</button></div></div></div>'

items = json.loads(ITEMS)
all_items = ''.join(item_card(i) for i in items)
reviews = ''.join(f'<div class="rv-card"><div class="rv-stars">\u2605\u2605\u2605\u2605\u2605</div><div class="rv-txt">"{r}"</div><div class="rv-auth">{a}</div></div>' for r,a in [
    ("Les meilleurs sandwichs du 93 ! Toujours frais et bien garnis.","Sophie M."),
    ("Service rapide m\u00eame tard, les tenders sont incroyables !","Karim L."),
    ("Enfin un vrai fast-food halal de qualit\u00e9 pr\u00e8s de chez moi.","Fatima Z."),
    ("Le milkshake Snickers est une tuerie !","Alex D.")
])

# Assemble
html = f'''<!DOCTYPE html>
<html lang="fr" data-theme="light">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>FAIS TON S'DALLE — Sandwichs sur mesure Halal</title>
<meta name="description" content="Cr\u00e9e ton sandwich sur mesure chez FAIS TON S'DALLE. Halal. Tenders, poulet, dinde, pastrami, rosette, thon. Livraison 23h-06h.">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://faistonsdalle.com">
<meta property="og:type" content="restaurant.menu"><meta property="og:site_name" content="FAIS TON S'DALLE">
<meta property="og:locale" content="fr_FR"><meta property="og:url" content="https://faistonsdalle.com">
<meta property="og:title" content="FAIS TON S'DALLE"><meta property="og:image" content="https://faistonsdalle.com/images/logo.jpg">
<meta name="theme-color" content="#c73b2b">
<link rel="manifest" href="/manifest.json">
<link rel="icon" type="image/jpeg" sizes="48x48" href="/images/favicon.jpg">
<link rel="apple-touch-icon" sizes="180x180" href="/images/apple-icon.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script src="https://js.stripe.com/v3/"></script>
<style>{CSS}</style>
</head>
<body>
<div class="bar"><span>\u2600\ufe0f 11h30\u201323h</span><span class="n">\U0001f319 Livraison 23h\u201306h</span><span class="h-badge">\U0001f54c Halal</span><span>\u2b50 4.5</span></div>

<header><div class="hd"><a href="#" class="lg"><img src="/images/logo.jpg" alt="FAIS TON S'DALLE" id="logo"><div class="br">FAIS TON S'DALLE<span class="sub">Sandwichs sur mesure</span></div></a>
<nav class="nv"><a class="sl" id="na-acc">Accueil</a><a id="na-menu">Menu</a><a id="na-ap">Infos</a><a id="na-con">Contact</a>
<button class="ham" id="ham">\u2630</button><button class="tg" id="tt">\U0001f319</button><div class="ct" id="ct">\U0001f6d2<span class="cb" id="cc">0</span></div></nav></div></header>
<div class="mn" id="mn"></div>
<div class="nb" id="nb">\U0001f319 Livraison 23h-06h</div>

<div class="hero"><div class="hero-c"><div class="hero-badge">\u2b50 4.5 \u00b7 Halal \u00b7 Les Pavillons-sous-Bois \u00b7 23h-06h</div>
<h1>Cr\u00e9e ton <span class="h">sandwich</span> sur mesure</h1>
<p class="hero-p">\U0001f969 Tenders \u00b7 poulet \u00b7 dinde \u00b7 pastrami \u00b7 thon \u00b7 8 crudit\u00e9s \u00b7 9 sauces</p>
<div class="hero-acts"><a class="hero-btn">Voir le menu</a><a class="hero-btn2">\U0001f4f1 WhatsApp</a></div></div>
<div class="hero-particles"><div class="hero-particle">\U0001f96a</div><div class="hero-particle">\U0001f969</div><div class="hero-particle">\U0001f957</div><div class="hero-particle">\U0001f964</div></div></div>

<div class="pg" id="acc"><div class="w"><div class="sec"><span class="hl">Menu</span></div>
<div class="tabs"><button class="on" data-c="all">Tout</button><button data-c="menus">Sandwichs</button><button data-c="desserts">Desserts</button><button data-c="boissons">Boissons</button></div>
<div class="grid" id="mg">{all_items}</div>
<div class="sec"><span class="hl">Avis</span></div>
<div class="rv" id="rv">{reviews}</div>
<div style="text-align:center;margin:0 0 24px"><a href="https://share.google/ohtsRFBl72o22DEi4" target="_blank" rel="noopener" class="ub" style="background:var(--p)">\u2b50 Avis Google</a></div>
<div class="nl"><h3>Newsletter</h3><p>Promos et nouveaut\u00e9s.</p><form id="nl1"><input type="email" id="nlmail" placeholder="ton@email.fr" required><button type="submit">\u2192</button></form></div></div></div>

<div class="pg h" id="menu"><div class="w"><div class="sec"><span class="hl">Carte</span></div>
<div class="tabs"><button class="on" data-c="all">Tout</button><button data-c="menus">Sandwichs</button><button data-c="desserts">Desserts</button><button data-c="boissons">Boissons</button></div>
<div class="grid" id="mg2">{all_items}</div>
<div style="text-align:center;margin:24px 0"><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle/qQkk53_5XNaUCkcZTskV6g" target="_blank" rel="noopener" class="ub2">Uber Eats</a></div></div></div>

<div class="pg h" id="ap">
<div class="ap-hero"><h1>Le concept <span class="h">FAIS TON S'DALLE</span></h1><p>Sandwichs sur mesure, 100% Halal, livraison 23h-06h</p></div>
<div class="w"><div class="ap">
<img src="/images/store-front.jpeg" alt="FAIS TON S'DALLE" id="about" class="store-img">
<p style="font-size:.7rem;color:var(--t2);margin-bottom:12px;text-align:center">134 All\u00e9e du Colonel Fabien, 93320 Les Pavillons-sous-Bois</p>
<div class="sec"><span class="hl">Notre concept</span></div>
<div class="ap-grid">
<div class="ap-card"><div class="ap-icon">\U0001f96a</div><h3>Tu choisis</h3><p>S\u00e9lectionne ton menu : L\u00e9ger (6,90\u20ac), Classique (7,90\u20ac) ou Gourmand (9,90\u20ac). Chaque sandwich est pr\u00e9par\u00e9 \u00e0 la commande.</p></div>
<div class="ap-card"><div class="ap-icon">\U0001f9c2</div><h3>Tu personnalises</h3><p>7 viandes (Tenders, Pastrami, Thon\u2026), 8 crudit\u00e9s fra\u00eeches, 9 sauces, 3 suppl\u00e9ments fromagers. Cuisson froide ou chaude.</p></div>
<div class="ap-card"><div class="ap-icon">\U0001f964</div><h3>Tu ajoutes</h3><p>Tiramisu maison (3\u20ac), Milkshake Snickers/M&Ms/KitKat + coulis (5\u20ac). Et une boisson fra\u00eeche \u00e0 1\u20ac.</p></div>
<div class="ap-card"><div class="ap-icon">\U0001f69a</div><h3>Tu re\u00e7ois</h3><p>Livraison offerte sur Les Pavillons-sous-Bois de 23h \u00e0 06h, ou \u00e0 emporter. Paiement s\u00e9curis\u00e9 Stripe.</p></div>
</div>
<div class="sec"><span class="hl">Une histoire de quartier</span></div>
<div class="ap-story">
<p><strong>FAIS TON S'DALLE</strong> est n\u00e9 d'une id\u00e9e simple : proposer des sandwichs de qualit\u00e9, <strong>100% Halal</strong>, avec des ingr\u00e9dients frais et un rapport qualit\u00e9-prix imbattable.</p>
<p>Pas de formule industrielle, pas de pains rassis. Chaque sandwich est mont\u00e9 \u00e0 la main avec des viandes s\u00e9lectionn\u00e9es et des l\u00e9gumes coup\u00e9s du jour.</p>
<p>Et parce que la faim ne se couche pas \u00e0 22h, on assure la livraison jusqu'\u00e0 6h du matin. Apr\u00e8s une soir\u00e9e, une session de jeu ou un creux de nuit, tu m\u00e9rites mieux.</p>
</div>
<div class="sec"><span class="hl">La carte</span></div>
<div class="ap-grid">
<div class="ap-card-sm"><h3>\U0001f969 Viandes</h3><p>Tenders, Eminc\u00e9 poulet, Blanc dinde, Jambon dinde, Pastrami, Rosette, Thon</p></div>
<div class="ap-card-sm"><h3>\U0001f957 Crudit\u00e9s</h3><p>Salade, Tomate, Concombre, Oignons, Poivrons, Ma\u00efs, Carottes, Avocat</p></div>
<div class="ap-card-sm"><h3>\U0001f9c0 Suppl\u00e9ments</h3><p>Cheddar, Mozzarella, Feta</p></div>
<div class="ap-card-sm"><h3>\U0001f9c2 Sauces</h3><p>Mayo, Ketchup, Alg\u00e9rienne, Samoura\u00ef, Blanche, Moutarde, Brasil, Chili, Thai</p></div>
</div>
<div class="sec"><span class="hl">Ils parlent de nous</span></div>
<div class="ap-gallery"><img src="/images/google-photo-1.jpeg" alt="" loading="lazy"><img src="/images/google-photo-2.jpeg" alt="" loading="lazy"><img src="/images/google-photo-3.jpeg" alt="" loading="lazy"><img src="/images/google-photo-4.jpeg" alt="" loading="lazy"></div>
<div style="text-align:center;margin:16px 0 24px"><a href="https://share.google/ohtsRFBl72o22DEi4" target="_blank" rel="noopener" class="ub" style="background:var(--p)">\u2b50 Laisser un avis Google</a></div>
<div class="sec"><span class="hl">Infos pratiques</span></div>
<div class="ap-grid">
<div class="ap-card-info"><div class="ap-icon-sm">\U0001f4cd</div><h3>Adresse</h3><p>134 All\u00e9e du Colonel Fabien<br>93320 Les Pavillons-sous-Bois</p><a href="https://maps.google.com/maps?q=FAIS+TON+S%27DALLE+134+All%C3%A9e+du+Colonel+Fabien+93320" target="_blank" class="ub" style="background:var(--p);font-size:.65rem;padding:6px 14px;margin-top:8px">Google Maps</a></div>
<div class="ap-card-info"><div class="ap-icon-sm">\U0001f550</div><h3>Horaires</h3><p><strong>\u2600\ufe0f Service</strong> : 11h30-23h<br><strong>\U0001f319 Livraison</strong> : 23h-06h</p><span class="h-badge" style="display:inline-block;margin-top:6px">7j/7</span></div>
<div class="ap-card-info"><div class="ap-icon-sm">\U0001f4de</div><h3>Contact</h3><p><a href="tel:+33672044875" style="font-weight:700;font-size:1.1rem;color:var(--p)">06 72 04 48 75</a></p></div>
<div class="ap-card-info"><div class="ap-icon-sm">\U0001f4b3</div><h3>Paiement</h3><p>100% s\u00e9curis\u00e9 Stripe<br>CB \u00b7 Apple Pay \u00b7 Google Pay</p></div>
</div>
</div></div></div>

<div class="pg h" id="con"><div class="w">
<div class="inf"><div><h3>Adresse</h3><p>134 All\u00e9e du Colonel Fabien, 93320</p></div><div><h3>Horaires</h3><p>Service 11h30-23h / Livraison 23h-06h</p></div><div><h3>T\u00e9l\u00e9phone</h3><p><a href="tel:+33672044875" style="color:var(--p);font-weight:800">06 72 04 48 75</a></p></div></div>
<div style="display:flex;gap:12px;margin:16px 0;flex-wrap:wrap"><a class="ub" style="background:#25D366" id="wa-btn">WhatsApp</a><a href="https://share.google/ohtsRFBl72o22DEi4" target="_blank" class="ub" style="background:var(--p)">Avis Google</a></div>
<div class="rv" id="rv2">{reviews}</div>
<div class="nl"><h3>Newsletter</h3><form id="nl2"><input type="email" placeholder="ton@email.fr" required><button type="submit">\u2192</button></form></div></div></div>

<div class="mod" id="mod"><div class="mod-bx"><div class="mod-hd"><h2>Personnalise</h2><button class="mod-cl">\u2715</button></div><div class="mod-bd" id="mb"></div><div class="mod-inst"><textarea id="mi" class="mod-ta" placeholder="Ex: pas d'oignons..." rows="2"></textarea></div><div class="mod-ft"><div class="mod-pr" id="mp"></div><button class="mod-ok">Ajouter</button></div></div></div>
<div class="mod" id="mod-t"><div class="mod-bx"><div class="mod-hd"><h2>Tiramisu</h2><button class="mod-cl">\u2715</button></div><div class="mod-bd" id="mb-t"></div><div class="mod-ft"><div class="mod-pr">3,00\u20ac</div><button class="mod-ok">Ajouter</button></div></div></div>
<div class="mod" id="mod-m"><div class="mod-bx"><div class="mod-hd"><h2>Milkshake</h2><button class="mod-cl">\u2715</button></div><div class="mod-bd" id="mb-m"></div><div class="mod-inst"><textarea id="mi-m" class="mod-ta" placeholder="Extra" rows="2"></textarea></div><div class="mod-ft"><div class="mod-pr">5,00\u20ac</div><button class="mod-ok">Ajouter</button></div></div></div>
<div class="mod" id="mod-pay"><div class="mod-bx"><div class="mod-hd"><h2>Paiement</h2><button class="mod-cl">\u2715</button></div><div class="mod-bd"><div style="text-align:center;padding:20px 0"><div style="font-size:2.5rem;margin-bottom:8px">\U0001f512</div><h3 style="font-weight:700;margin-bottom:4px">Paiement s\u00e9curis\u00e9</h3><p style="font-size:.72rem;color:var(--t2);margin-bottom:16px">CB \u00b7 Apple Pay \u00b7 Google Pay</p><div class="pay-summary" style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px"><div style="display:flex;justify-content:space-between"><span>Total</span><span id="pay-total" style="font-weight:700;color:var(--p)">0,00\u20ac</span></div></div><input type="text" id="pay-name" placeholder="Votre nom" class="mod-ta" style="width:100%;margin-bottom:8px"><button id="pay-btn" class="mod-ok" style="width:100%;padding:12px">Payer</button></div></div></div></div>

<div class="co" id="co"></div>
<div class="cp" id="cp"><div class="cp-hd"><div><h3>Panier</h3></div><button class="cp-x">\u2715</button></div>
<div class="cp-mode-inline"><div class="cmd-toggle" id="cp-mode-toggle"><button class="on" id="cp-mode-livraison">\U0001f69a Livraison</button><button id="cp-mode-emporter">\U0001f961 \u00c0 emporter</button></div></div>
<div class="cp-its" id="ci"><div class="cp-em">Panier vide</div></div>
<div class="cp-ft"><div class="cp-tr"><span>Total</span><span class="cp-ta" id="ct">0,00\u20ac</span></div><button class="cp-ck">Payer <span id="c2"></span></button></div></div>

<div class="toast" id="toast"><span id="tm"></span></div>
<div class="ni" id="ni"><span>\U0001f319</span><span>Livraison<br><strong>23h-06h</strong></span></div>
<button id="top-btn">\u2191</button>

<footer><div class="fi"><div><h4>FAIS TON S'DALLE</h4><p>Sandwichs Halal 7j/7</p></div><div><h4>Contact</h4><p>\U0001f4de 06 72 04 48 75</p><p>134 All\u00e9e du Colonel Fabien</p></div><div><h4>Suivez</h4><a href="https://www.tiktok.com/@faistonsdalle">TikTok</a><a href="https://www.ubereats.com/fr-en/store/fais-ton-sdalle">Uber Eats</a></div><div><h4>Infos</h4><a href="/mentions-legales.html">Mentions l\u00e9gales</a><a href="/cgv.html">CGV</a></div></div>
<div class="fb">\u00a9 2026 FAIS TON S'DALLE</div></footer>

<script>
var M={ITEMS};

{JS}
</script>
</body>
</html>'''

html = html.replace('{ITEMS}', ITEMS).replace('{JS}', JS)

# Write file
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# Verify
total = len(html)
o = html.count('{')
c = html.count('}')
o_tag = html.count('<script')
c_tag = html.count('</script>')

print(f"✅ FILE WRITTEN: {total} bytes")
print(f"✅ Braces: {o}/{c} {'OK' if o==c else 'MISMATCH!'}")
print(f"✅ Script tags: {o_tag}/{c_tag} {'OK' if o_tag==c_tag else 'MISMATCH!'}")
print(f"✅ Has <body>: {'<body>' in html}")
print(f"✅ Has pages: {all(x in html for x in ['id=\"acc\"','id=\"menu\"','id=\"ap\"','id=\"con\"','id=\"cp\"'])}")
print(f"✅ Has modals: {all(x in html for x in ['id=\"mod\"','id=\"mod-t\"','id=\"mod-m\"','id=\"mod-pay\"'])}")

# Final JS check
js_start = html.rfind('<script>')
js_end = html.rfind('</script>')
js_block = html[js_start+8:js_end]

with tempfile.NamedTemporaryFile(suffix='.js', mode='w', delete=False, encoding='utf-8') as f:
    f.write(js_block)
    fname = f.name

result = subprocess.run(['node', '--check', fname], capture_output=True, text=True)
os.unlink(fname)

if result.returncode == 0:
    print(f"✅ JS VALID ({len(js_block)} chars)")
else:
    print(f"❌ JS ERROR: {result.stderr[:200]}")
    sys.exit(1)

# Check mobile header fix
if '.hd{height:48px' in html and '.hd{height:44px' in html:
    print("✅ Mobile header fix applied")
if '.br .sub{display:none}' in html:
    print("✅ Subtitle hidden on mobile")
if '@media(min-width:769px){.br .sub{display:block}}' in html:
    print("✅ Subtitle visible on desktop")

print("\n🎉 BUILD COMPLETE!")
