document.addEventListener('DOMContentLoaded', () => {
  const modal   = document.getElementById('meal-modal');
  const editBtn = document.getElementById('mmodal-edit');
  const removeBtn = document.getElementById('mmodal-remove');
  const youtubeEl = document.getElementById('modal-youtube');
  const sourceEl = document.getElementById('modal-source');

  const el = {
    title: document.getElementById('modal-title'),
    category: document.getElementById('modal-category'),
    area: document.getElementById('modal-area'),
    instructions: document.getElementById('modal-instructions'),
    tagsWrap: document.getElementById('modal-tags'),
    ingsWrap: document.getElementById('modal-ingredients'),
    measWrap: document.getElementById('modal-measures'),
  };

  if (!modal || !editBtn || !el.title) return;

  function $(sel, ctx=document) { return ctx.querySelector(sel); }
  function makeInput(value='', attrs={}) {
    const i = document.createElement('input');
    i.type = 'text';
    i.value = value || '';
    Object.assign(i, attrs);
    i.className = 'input-edit';
    return i;
  }
  function makeNumber(value='', attrs={}) {
    const i = document.createElement('input');
    i.type = 'number';
    i.step = '0.01';
    i.min = '0';
    i.value = value ?? '';
    Object.assign(i, attrs);
    i.className = 'input-edit';
    return i;
  }
  function makeTextarea(value='', attrs={}) {
    const t = document.createElement('textarea');
    t.value = value || '';
    t.rows = 4;
    Object.assign(t, attrs);
    t.className = 'textarea-edit';
    return t;
  }
  function textFromList(ul) {
    return [...ul.querySelectorAll('li')].map(li => li.textContent.trim()).filter(Boolean);
  }
  function renderList(ul, arr) {
    ul.innerHTML = '';
    (arr || []).forEach(v => {
      if (!v) return;
      const li = document.createElement('li');
      li.textContent = v;
      ul.appendChild(li);
    });
  }
  function renderTags(container, tags) {
    container.innerHTML = '';
    (tags || []).forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      container.appendChild(span);
    });
  }
  function setStatus(msg) {
    const s = document.getElementById('status');
    if (!s) return;
    s.textContent = msg || '';
    if (msg) setTimeout(() => (s.textContent=''), 2000);
  }

  const right = $('.mmodal-actions .right') || editBtn.parentElement;
  const saveBtn = document.createElement('button');
  saveBtn.id = 'mmodal-save';
  saveBtn.className = 'btn-primary hidden';
  saveBtn.textContent = 'Salva';
  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'mmodal-cancel';
  cancelBtn.className = 'btn-secondary hidden';
  cancelBtn.textContent = 'Annulla';
  right.appendChild(saveBtn);
  right.appendChild(cancelBtn);

  const editors = document.createElement('div');
  editors.id = 'mmodal-editors';
  editors.className = 'mmodal-editors hidden';
  const titleRow = $('.modal-title-row', modal);
  titleRow.insertAdjacentElement('afterend', editors);

  let isEditing = false;
  window.isEditing = false;
  const original = {};
  const inputs = {};

  function readPriceFromCard(itemId) {
    const priceEl = document.querySelector(`.meal-card[data-item-id="${CSS.escape(itemId)}"] .meal-price`);
    if (!priceEl) return '';
    const t = priceEl.textContent.trim().replace(/[^\d.,]/g,'').replace(',','.');
    return t ? parseFloat(t) : '';
  }
  function writePriceToCard(itemId, price) {
    const priceEl = document.querySelector(`.meal-card[data-item-id="${CSS.escape(itemId)}"] .meal-price`);
    if (priceEl) priceEl.textContent = isFinite(price) ? `€${Number(price).toFixed(2)}` : '';
  }

  function toggleButtons() {
    editBtn.classList.toggle('hidden', isEditing);
    saveBtn.classList.toggle('hidden', !isEditing);
    cancelBtn.classList.toggle('hidden', !isEditing);
    if (removeBtn) removeBtn.disabled = isEditing;
    editors.classList.toggle('hidden', !isEditing);
    window.isEditing = isEditing; // Aggiorna la variabile globale
  }

  function enterEdit() {
    if (isEditing) return;
    isEditing = true;

    const itemId = modal.dataset.itemId;
    const idxStr = modal.dataset.idx;
    const idx = Number(idxStr);
    const md = (typeof modalData !== 'undefined' && Number.isFinite(idx)) ? modalData[idx] : null;
    original.strMeal = el.title.textContent.trim();
    original.strCategory = el.category.textContent.trim();
    original.strArea = el.area.textContent.trim();
    original.strInstructions = el.instructions.textContent.trim();
    original.tags = [...el.tagsWrap.querySelectorAll('.tag')].map(t=>t.textContent.trim());
    original.ingredients = textFromList(el.ingsWrap);
    original.measures    = textFromList(el.measWrap);
    original.prezzo = readPriceFromCard(itemId);
    original.youtube = md?.youtube || (youtubeEl?.href && !youtubeEl.classList.contains('hidden') ? youtubeEl.href : '');
    original.source = md?.source || (sourceEl?.href && !sourceEl.classList.contains('hidden') ? sourceEl.href : '');

    editors.innerHTML = `
      <div class="edit-grid">
        <label>Titolo</label>
        <div id="ed-title"></div>

        <label>Categoria</label>
        <div id="ed-category"></div>

        <label>Origini</label>
        <div id="ed-area"></div>

        <label>Prezzo (€)</label>
        <div id="ed-price"></div>

        <label>Tags (vai a capo per ogni Tag)</label>
        <div id="ed-tags"></div>

        <label>Youtube URL</label>
        <div id="ed-youtube"></div>

        <label>Link</label>
        <div id="ed-source"></div>

        <label>Istruzioni</label>
        <div id="ed-instructions"></div>

        <label>Ingredienti (vai a capo per ogni Ingrediente)</label>
        <div id="ed-ings"></div>

        <label>Misure (vai a capo per ogni Misura)</label>
        <div id="ed-meas"></div>
      </div>
    `;

    inputs.strMeal       = makeInput(original.strMeal);
    inputs.strCategory   = makeInput(original.strCategory);
    inputs.strArea       = makeInput(original.strArea);
    inputs.prezzo        = makeNumber(original.prezzo);
    inputs.strTags       = makeTextarea(original.tags.join('\n'));
    inputs.youtube        = makeInput(original.youtube || '');
    inputs.source         = makeInput(original.source || '');
    inputs.strInstructions = makeTextarea(original.strInstructions);
    inputs.ingredients   = makeTextarea(original.ingredients.join('\n'));
    inputs.measures      = makeTextarea(original.measures.join('\n'));

    $('#ed-title', editors).appendChild(inputs.strMeal);
    $('#ed-category', editors).appendChild(inputs.strCategory);
    $('#ed-area', editors).appendChild(inputs.strArea);
    $('#ed-price', editors).appendChild(inputs.prezzo);
    $('#ed-tags', editors).appendChild(inputs.strTags);
    $('#ed-youtube', editors).appendChild(inputs.youtube);
    $('#ed-source', editors).appendChild(inputs.source);
    $('#ed-instructions', editors).appendChild(inputs.strInstructions);
    $('#ed-ings', editors).appendChild(inputs.ingredients);
    $('#ed-meas', editors).appendChild(inputs.measures);

    toggleButtons();
    inputs.strMeal.focus();
  }

  function exitEdit(restore) {
    if (!isEditing) return;
    if (restore) {
      el.title.textContent = original.strMeal;
      el.category.textContent = original.strCategory;
      el.area.textContent = original.strArea;
      el.instructions.textContent = original.strInstructions;
      renderTags(el.tagsWrap, original.tags);
      renderList(el.ingsWrap, original.ingredients);
      renderList(el.measWrap, original.measures);
      if (modal.dataset.itemId) writePriceToCard(modal.dataset.itemId, original.prezzo);
    }
    editors.innerHTML = '';
    isEditing = false;
    toggleButtons();
  }

  function cleanArrayFromTextarea(val) {
    return String(val || '')
      .split(/\r?\n|,/g)
      .map(s => s.trim())
      .filter(Boolean);
  }

async function save() {
  const itemId = modal.dataset.itemId;
  if (!itemId) return exitEdit(true);

  const payload = {};
  const changed = (k, v) => (payload[k] = v);

  const vTitle = inputs.strMeal.value.trim();
  if (vTitle !== original.strMeal) changed('strMeal', vTitle);

  const vCat = inputs.strCategory.value.trim();
  if (vCat !== original.strCategory) changed('strCategory', vCat);

  const vArea = inputs.strArea.value.trim();
  if (vArea !== original.strArea) changed('strArea', vArea);

  const vInstr = inputs.strInstructions.value.trim();
  if (vInstr !== original.strInstructions) changed('strInstructions', vInstr);

  const vTags = cleanArrayFromTextarea(inputs.strTags.value);
  if (JSON.stringify(vTags) !== JSON.stringify(original.tags)) changed('strTags', vTags);

  const vIngs = cleanArrayFromTextarea(inputs.ingredients.value);
  if (JSON.stringify(vIngs) !== JSON.stringify(original.ingredients)) changed('ingredients', vIngs);

  const vMeas = cleanArrayFromTextarea(inputs.measures.value);
  if (JSON.stringify(vMeas) !== JSON.stringify(original.measures)) changed('measures', vMeas);

  const vYoutube = inputs.youtube.value.trim();
  if (vYoutube !== (original.youtube || '')) changed('youtube', vYoutube);

  const vSource = inputs.source.value.trim();
  if (vSource !== (original.source || '')) changed('source', vSource);

  const rawPrice = inputs.prezzo.value;
  const vPrice = rawPrice === '' ? '' : Number(rawPrice);
  const priceChanged = (original.prezzo === '' && rawPrice !== '') ||
                       (original.prezzo !== '' && Number(original.prezzo) !== vPrice);
  if (priceChanged) changed('prezzo', Number.isFinite(vPrice) ? vPrice : 0);

  if (Object.keys(payload).length === 0) { exitEdit(false); return; }

  try {
    saveBtn.disabled = cancelBtn.disabled = editBtn.disabled = true;

    const res = await fetch(`/api/my-menu/${encodeURIComponent(itemId)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);

    if ('strMeal'         in payload) el.title.textContent        = payload.strMeal;
    if ('strCategory'     in payload) el.category.textContent     = payload.strCategory;
    if ('strArea'         in payload) el.area.textContent         = payload.strArea;
    if ('strInstructions' in payload) el.instructions.textContent = payload.strInstructions;
    if ('strTags'         in payload) renderTags(el.tagsWrap, payload.strTags);
    if ('ingredients'     in payload) renderList(el.ingsWrap, payload.ingredients);
    if ('measures'        in payload) renderList(el.measWrap, payload.measures);
    if ('prezzo'          in payload) writePriceToCard(itemId, payload.prezzo);
    if (youtubeEl && 'youtube' in payload) {
      const yt = payload.youtube;
      if (yt) {
        youtubeEl.href = yt;
        youtubeEl.classList.remove('hidden');
      } else {
        youtubeEl.href = '#';
        youtubeEl.classList.add('hidden');
      }
    }
    if (sourceEl && 'source' in payload) {
      const src = payload.source;
      if (src) {
        sourceEl.href = src;
        sourceEl.classList.remove('hidden');
      } else {
        sourceEl.removeAttribute('href');
        sourceEl.textContent = '';
        sourceEl.classList.add('hidden');
      }
    }

    let idx = Number(modal.dataset.idx);
    if (!Number.isFinite(idx)) {
      const card = document.querySelector(`.meal-card[data-item-id="${CSS.escape(itemId)}"]`);
      if (card) idx = Number(card.dataset.idx);
    }
    if (Number.isFinite(idx) && typeof modalData !== 'undefined' && modalData[idx]) {
      const md = modalData[idx];
      if ('strMeal'         in payload) md.title        = payload.strMeal;
      if ('strCategory'     in payload) md.category     = payload.strCategory;
      if ('strArea'         in payload) md.area         = payload.strArea;
      if ('strInstructions' in payload) md.instructions = payload.strInstructions;
      if ('strTags'         in payload) md.tags         = Array.isArray(payload.strTags) ? payload.strTags : [];
      if ('ingredients'     in payload) md.ingredients  = payload.ingredients || [];
      if ('measures'        in payload) md.measures     = payload.measures || [];
      if ('prezzo'          in payload) md.prezzo       = payload.prezzo;
      if ('youtube'         in payload) md.youtube      = payload.youtube || '';
      if ('source'          in payload) md.source       = payload.source || '';
    }

    const cardTitle = document.querySelector(
      `.meal-card[data-item-id="${CSS.escape(itemId)}"] .meal-title`
    );
    if (cardTitle && 'strMeal' in payload) cardTitle.textContent = payload.strMeal;

    exitEdit(false);
  } catch (err) {
    console.error(err);
    setStatus('Errore salvataggio');
    exitEdit(true);
  } finally {
    saveBtn.disabled = cancelBtn.disabled = editBtn.disabled = false;
  }
}


  editBtn.addEventListener('click', enterEdit);
  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', () => exitEdit(true));
});
