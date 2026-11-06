// Logique commune des pages de test P1/P2/P3 : mount({ mode: 'veil' | 'bar' | 'dock', ... })
function mount(opt) {
  const { mode } = opt;
  document.body.insertAdjacentHTML('beforeend', `
  <div class="veil"><div class="win m-${mode}" id="win">
    <div class="head"><h2>Ajouter des animés</h2><button class="x" aria-label="Fermer">✕</button></div>
    <div class="bar"><label class="srch"><span id="ic"></span><input id="q" placeholder="Titre d'un animé…" autocomplete="off"><kbd>/</kbd><button class="clr" id="clr" type="button" aria-label="Effacer">✕</button></label></div>
    <div class="tools" id="tools"></div>
    <div class="cnt" id="cnt"></div>
    <div class="grid" id="grid"></div>
    <div class="foot" id="foot"></div>
    <div class="toast" id="toast"></div>
  </div></div>`);
  document.getElementById('ic').innerHTML = ICON;
  const $ = (id) => document.getElementById(id);
  if (opt.states) {
    const S = [["strip", "Barre"], ["float", "Pilule"], ["chip", "Puce"], ["under", "Sous l'affiche"], ["icon", "Rond + texte"]];
    document.querySelector(".veil").insertAdjacentHTML("afterbegin", '<div class="sw"><span>Forme du bouton :</span>' + S.map(([k, n], i) => '<button class="pill' + (i ? "" : " on") + '" data-s="' + k + '">' + n + "</button>").join("") + "</div>");
    const setStyle = (k) => {
      S.forEach(([x]) => $("win").classList.remove("s-" + x));
      $("win").classList.add("s-" + k);
      document.querySelectorAll(".sw .pill").forEach((p) => p.classList.toggle("on", p.dataset.s === k));
    };
    setStyle("strip");
    document.querySelector(".sw").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (b) setStyle(b.dataset.s); });
  }
  const added = new Set([2, 6]);
  let kf = 0, hideAdded = false, type = 'Tous', timer, undo = null;
  const hl = (t, s) => { const i = norm(t).indexOf(norm(s.trim())); return !s.trim() || i < 0 ? t : t.slice(0, i) + '<mark>' + t.slice(i, i + s.trim().length) + '</mark>' + t.slice(i + s.trim().length); };

  function results() {
    let rows = $('q').value.trim() ? found($('q').value) : [];
    if (hideAdded) rows = rows.filter((m) => !added.has(m.n));
    return type === 'Films' ? [] : rows;
  }
  function overlay(m) {
    const a = added.has(m.n);
    if (mode === 'veil') return `<span class="ov"><span class="plus">${a ? '✓' : '+'}</span></span>`;
    if (mode === 'bar') return `<span class="ov"><span class="abar">${a ? '<i class="ic dot"></i><span class="t1">Ajouté</span><span class="t2">Retirer</span>' : '<i class="ic">+</i><span class="tx">Ajouter</span>'}</span></span>`;
    return '';
  }
  function draw(skeleton) {
    const s = $('q').value, rows = results();
    $('win').classList.toggle('has-q', !!s);
    $('tools').innerHTML = ['Tous', 'Séries', 'Films'].map((t) => `<button class="pill${t === type ? ' on' : ''}" data-ty="${t}">${t}${s.trim() ? `<small>${t === 'Films' ? 0 : found(s).length}</small>` : ''}</button>`).join('') + (opt.hideToggle ? `<span class="tog${hideAdded ? ' on' : ''}" id="tog"><i></i>Masquer ceux déjà ajoutés</span>` : '');
    $('cnt').textContent = opt.count && s.trim() && !skeleton ? `${rows.length} résultat${rows.length > 1 ? 's' : ''}` : '';
    if (skeleton) { $('grid').innerHTML = '<div class="sk"></div>'.repeat(8); }
    else if (!s.trim()) { $('grid').innerHTML = '<div class="hint"><div class="big">🔎</div><p>Tape le titre d’un animé</p><small>En français, en anglais ou en japonais — « L’Attaque des Titans » et « Shingeki no Kyojin » marchent tous les deux.</small></div>'; }
    else if (!rows.length) { $('grid').innerHTML = `<div class="empty"><div class="big">🤔</div><p>Rien dans la base pour « ${s} ».</p><small>Les sorties très récentes ne sont pas toujours dedans.</small><br><button id="ani">Chercher sur AniList</button></div>`; }
    else {
      kf = Math.min(kf, rows.length - 1);
      $('grid').innerHTML = rows.map((m, i) => `<button class="it${added.has(m.n) ? ' added' : ''}${opt.kb && i === kf ? ' kf' : ''}" data-n="${m.n}" style="--d:${opt.stagger ? i : 0}"><span class="pic"><img src="${m.i}" alt="">${overlay(m)}</span><b>${hl(m.t, s)}</b><span class="meta">${m.meta}</span></button>`).join('');
    }
    foot();
  }
  function foot() {
    if (mode === 'dock') {
      const th = [...added].map((n) => `<img src="${MOCK[n].i}" alt="" title="${MOCK[n].t}">`).join('');
      $('foot').innerHTML = `<div class="dock"><div class="th">${th || '<span class="none">Rien de sélectionné pour l’instant</span>'}</div><a id="ani2">AniList</a></div><span class="count">${added.size ? added.size + ' sélectionné' + (added.size > 1 ? 's' : '') : ''}</span><button class="go">Ajouter${added.size ? ' (' + added.size + ')' : ''}</button>`;
    } else {
      $('foot').innerHTML = `<a id="ani2">Pas trouvé ? Chercher aussi sur AniList</a><span class="count">${added.size ? added.size + ' ajouté' + (added.size > 1 ? 's' : '') : ''}</span><button class="go">Terminé</button>`;
    }
  }
  function toast(msg, n) {
    if (!opt.undo) return;
    $('toast').innerHTML = `<span>${msg}</span><button id="undo">Annuler</button>`;
    $('toast').classList.add('show'); undo = n;
    clearTimeout(timer); timer = setTimeout(() => $('toast').classList.remove('show'), 3000);
  }
  function toggle(n) {
    if (added.has(n)) added.delete(n); else { added.add(n); toast(`« ${MOCK[n].t} » ajouté dans Non classé`, n); }
    draw();
  }
  let sk;
  $('q').addEventListener('input', () => {
    kf = 0;
    if (opt.shimmer && $('q').value.trim()) { draw(true); clearTimeout(sk); sk = setTimeout(() => draw(), 260); } else draw();
  });
  $('q').addEventListener('keydown', (e) => {
    if (!opt.kb) return;
    const n = document.querySelectorAll('.it').length, cols = Math.max(1, Math.floor($('grid').clientWidth / 140));
    const mv = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
    if (mv !== undefined && n) { e.preventDefault(); kf = Math.max(0, Math.min(n - 1, kf + mv)); draw(); document.querySelector('.kf')?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter' && n) { e.preventDefault(); toggle(+document.querySelectorAll('.it')[kf].dataset.n); }
    if (e.key === 'Escape') { $('q').value = ''; draw(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== $('q')) { e.preventDefault(); $('q').focus(); } });
  $('clr').onclick = () => { $('q').value = ''; $('q').focus(); draw(); };
  $('tools').addEventListener('click', (e) => {
    const p = e.target.closest('[data-ty]'); if (p) { type = p.dataset.ty; draw(); }
    if (e.target.closest('#tog')) { hideAdded = !hideAdded; draw(); }
  });
  $('grid').addEventListener('click', (e) => { const b = e.target.closest('.it'); if (b) toggle(+b.dataset.n); });
  $('toast').addEventListener('click', (e) => { if (e.target.id === 'undo' && undo != null) { added.delete(undo); $('toast').classList.remove('show'); draw(); } });
  $('q').focus();
  draw();
}
