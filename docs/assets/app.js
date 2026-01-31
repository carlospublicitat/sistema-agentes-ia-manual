// UX acordada: menú colapsable (siempre reabrible) + tabs + buscador global de contenido (no filtra el menú)
(() => {
  const btnToggle = document.getElementById('menuToggle');
  const tabs = [...document.querySelectorAll('.tab')];
  const docs = [...document.querySelectorAll('.doc')];
  const toc = document.getElementById('toc');

  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  const resultsBox = document.getElementById('searchResults');

  // --- Menú: toggle robusto ---
  function setCollapsed(collapsed){
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    btnToggle.setAttribute('aria-expanded', String(!collapsed));
    try { localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0'); } catch {}
  }
  const saved = (() => { try { return localStorage.getItem('sidebar-collapsed') === '1'; } catch { return false; } })();
  setCollapsed(saved);

  btnToggle.addEventListener('click', () => {
    setCollapsed(!document.body.classList.contains('sidebar-collapsed'));
  });

  // Atajo teclado: Ctrl+M
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      setCollapsed(!document.body.classList.contains('sidebar-collapsed'));
    }
    if (e.key === 'Escape') hideResults();
  });

  // --- Tabs ---
  function setActiveDoc(name){
    docs.forEach(d => d.classList.toggle('is-active', d.dataset.doc === name));
    tabs.forEach(t => {
      const active = t.dataset.tab === name;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    buildTOC(name);
  }

  tabs.forEach(t => t.addEventListener('click', () => setActiveDoc(t.dataset.tab)));

  // --- TOC: de headings del doc activo ---
  function buildTOC(docName){
    toc.innerHTML = '';
    const doc = docs.find(d => d.dataset.doc === docName);
    if (!doc) return;

    const headings = [...doc.querySelectorAll('h1[id],h2[id],h3[id]')];
    headings.forEach(h => {
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.trim();
      a.className = 'lvl-' + h.tagName.toLowerCase();
      a.addEventListener('click', () => {
        // En móvil, al navegar, colapsa para dejar leer
        if (window.matchMedia('(max-width: 920px)').matches) setCollapsed(true);
      });
      toc.appendChild(a);
    });
  }

  // --- Buscar: indexa TODO el contenido de las 3 secciones ---
  function collectIndex(){
    const items = [];
    docs.forEach(doc => {
      const docName = doc.dataset.doc;
      const docTitle = doc.querySelector('h1')?.textContent?.trim() || docName;

      const nodes = [...doc.querySelectorAll('h1[id],h2[id],h3[id],p,li')];
      nodes.forEach(el => {
        const text = (el.innerText || '').trim();
        if (!text) return;

        // Resolver ancla: si el elemento tiene id, o heading anterior con id
        let anchorId = el.id || null;
        if (!anchorId){
          const prev = el.previousElementSibling;
          const prevHeading = (prev && prev.matches && prev.matches('h1[id],h2[id],h3[id]')) ? prev :
            el.closest('section')?.querySelector('h1[id],h2[id],h3[id]');
          anchorId = prevHeading?.id || doc.querySelector('h1[id]')?.id || null;
        }

        items.push({
          docName,
          docTitle,
          anchor: anchorId ? ('#' + anchorId) : null,
          text,
        });
      });
    });
    return items;
  }

  const INDEX = collectIndex();

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function highlight(snippet, q){
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
    return escapeHtml(snippet).replace(re, m => '<mark>' + escapeHtml(m) + '</mark>');
  }

  function makeSnippet(text, q){
    const t = text;
    const lowT = t.toLowerCase();
    const lowQ = q.toLowerCase();
    const i = lowT.indexOf(lowQ);
    const limit = 160;
    if (i < 0) return escapeHtml(t.slice(0, limit)) + (t.length > limit ? '…' : '');
    const start = Math.max(0, i - 60);
    const end = Math.min(t.length, i + 100);
    const raw = (start > 0 ? '…' : '') + t.slice(start, end) + (end < t.length ? '…' : '');
    return highlight(raw, q);
  }

  function showResults(html){
    resultsBox.innerHTML = html;
    resultsBox.style.display = 'block';
  }
  function hideResults(){
    resultsBox.style.display = 'none';
    resultsBox.innerHTML = '';
  }

  function jumpTo(hit){
    // Cambiar a la pestaña correcta antes de navegar
    setActiveDoc(hit.docName);

    // Navegar
    if (hit.anchor) {
      location.hash = hit.anchor;
      // Enfocar contenido para accesibilidad
      document.getElementById('content')?.focus?.();
      // Scroll suave al heading
      const el = document.querySelector(hit.anchor);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // En móvil, oculta resultados y menú para leer
    hideResults();
    if (window.matchMedia('(max-width: 920px)').matches) setCollapsed(true);
  }

  function renderResults(q, hits){
    const header = `<div style="padding:6px 8px; color:#666; font-size:12px;">
      ${hits.length ? `${hits.length} resultado(s) para <strong>${escapeHtml(q)}</strong>` : `Sin resultados para <strong>${escapeHtml(q)}</strong>`}
    </div>`;
    if (!hits.length) return header;

    const body = hits.map((h, idx) => {
      const meta = `${h.docTitle}${h.anchor ? ' · ' + h.anchor.replace('#','') : ''}`;
      const snippet = makeSnippet(h.text, q);
      return `<a class="result" href="javascript:void(0)" data-idx="${idx}">
        <div class="meta">${escapeHtml(meta)}</div>
        <div class="snippet">${snippet}</div>
      </a>`;
    }).join('');
    return header + body;
  }

  let t = null;
  function onSearch(){
    const q = input.value.trim();
    if (q.length < 2) { hideResults(); return; }

    const lowQ = q.toLowerCase();
    const hits = INDEX
      .filter(it => it.text.toLowerCase().includes(lowQ))
      .slice(0, 20);

    showResults(renderResults(q, hits));

    // Click handler resultados
    [...resultsBox.querySelectorAll('.result')].forEach(a => {
      a.addEventListener('click', () => {
        const idx = Number(a.dataset.idx);
        const hit = hits[idx];
        if (hit) jumpTo(hit);
      });
    });
  }

  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(onSearch, 140);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) onSearch();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    hideResults();
    input.focus();
  });

  // Click fuera: cierra resultados
  document.addEventListener('click', (e) => {
    if (!resultsBox.contains(e.target) && e.target !== input && e.target !== clearBtn) {
      hideResults();
    }
  });

  // --- Inicial ---
  setActiveDoc('instalacion');

  // Marcar item actual en TOC según hash
  function syncTOC(){
    const hash = location.hash;
    [...toc.querySelectorAll('a')].forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === hash));
  }
  window.addEventListener('hashchange', syncTOC);
  syncTOC();
})();
