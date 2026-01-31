const STORAGE_KEY="manual_v1_progress";
const qs=(s,el=document)=>el.querySelector(s);
const qsa=(s,el=document)=>Array.from(el.querySelectorAll(s));
function loadProgress(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}catch(e){return {}}}
function saveProgress(p){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(p))}catch(e){}}
function updateNavPills(){
  qsa("[data-page]").forEach(item=>{
    const page=item.getAttribute("data-page");
    const steps=qsa(`input[type=checkbox][data-step^='${page}::']`);
    if(!steps.length) return;
    const done=steps.filter(s=>s.checked).length;
    const pill=item.querySelector(".pill"); if(!pill) return;
    pill.textContent=`${done}/${steps.length}`;
    pill.classList.toggle("done", done===steps.length);
  });
}
function initSteps(){
  const p=loadProgress();
  qsa("input[type=checkbox][data-step]").forEach(cb=>{
    const id=cb.getAttribute("data-step");
    cb.checked=!!p[id];
    cb.addEventListener("change",()=>{
      const pp=loadProgress();
      pp[id]=cb.checked?1:0;
      saveProgress(pp);
      updateNavPills();
    });
  });
  updateNavPills();
}
function initCopy(){
  qsa(".copybtn").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const pre=btn.closest(".codewrap")?.querySelector("pre");
      const txt=pre?.innerText||"";
      try{await navigator.clipboard.writeText(txt)}catch(e){
        const ta=document.createElement("textarea");
        ta.value=txt; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy");
        document.body.removeChild(ta);
      }
      const old=btn.textContent; btn.textContent="Copiado ✓";
      setTimeout(()=>btn.textContent=old,900);
    });
  });
}
function initNavSearch(){
  const input=qs("#navSearch"); if(!input) return;
  input.addEventListener("input",()=>{
    const q=input.value.trim().toLowerCase();
    qsa(".navitem[data-search]").forEach(el=>{
      const hay=(el.getAttribute("data-search")||"").toLowerCase();
      el.style.display=(!q||hay.includes(q))?"":"none";
    });
    qsa(".navsection").forEach(sec=>{
      const any=qsa(".navitem",sec).some(i=>i.style.display!=="none");
      const title=qs(".navsection-title",sec);
      if(title) title.style.display=any?"":"none";
    });
  });
}
function initAnchorsOffset(){
  qsa("a[href^='#']").forEach(a=>{
    a.addEventListener("click",(e)=>{
      const id=a.getAttribute("href").slice(1);
      const t=document.getElementById(id); if(!t) return;
      e.preventDefault();
      const top=t.getBoundingClientRect().top + window.scrollY - 74;
      window.scrollTo({top,behavior:"smooth"});
      history.replaceState(null,"","#"+id);
    });
  });
}
function initTOC(){
  const toc=qs("#tocList"); if(!toc) return;
  toc.innerHTML="";
  qsa("main h2, main h3").forEach(h=>{
    if(!h.id){
      h.id=h.textContent.trim().toLowerCase()
        .replace(/[^a-z0-9áéíóúñü ]/gi,"")
        .replace(/\s+/g,"-").slice(0,60);
    }
    const a=document.createElement("a");
    a.className="tocitem"; a.href="#"+h.id; a.textContent=h.textContent;
    toc.appendChild(a);
  });
}
document.addEventListener("DOMContentLoaded",()=>{
  initSteps(); initCopy(); initNavSearch(); initAnchorsOffset(); initTOC();
});
