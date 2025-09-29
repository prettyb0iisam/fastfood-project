let itemIdByMealId = new Map();
let selectedIds = new Set();
let allMeals = [];

document.addEventListener('DOMContentLoaded', async () => {
  allMeals = await fetchMeals();
  const myMenu = await fetchMyMenu();

  selectedIds = new Set(myMenu.map(x => x.meal._id));
  itemIdByMealId = new Map(myMenu.map(x => [x.meal._id, x._id]));

  renderCards(allMeals, selectedIds);
  
  const viewMenuBtn = document.getElementById('viewMenuBtn');
  if (viewMenuBtn) {
    viewMenuBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const restaurantName = await fetchRestaurantName();
      if (restaurantName) {
        const encodedName = encodeURIComponent(restaurantName);
        window.location.href = `/mymenu?ristorante=${encodedName}`;
      } else {
        showStatus('Errore: impossibile ottenere il nome del ristorante');
      }
    });
  }
});

async function fetchRestaurantName() {
  try {
    const res = await fetch('/api/profilo', { credentials: 'include' });
    if (!res.ok) throw new Error('Errore caricamento profilo');
    const profile = await res.json();
    return profile.nomeRistorante || '';
  } catch (e) {
    console.error(e);
    return '';
  }
}

async function fetchMeals() {
  try {
    const res = await fetch('/api/meals', { credentials: 'include' });
    if (!res.ok) throw new Error('Errore caricamento meals');
    return await res.json();
  } catch (e) {
    console.error(e);
    showStatus('Errore nel caricamento dei piatti');
    return [];
  }
}
async function fetchMyMenu() {
  try {
    const res = await fetch('/api/my-menu', { credentials: 'include' });
    if (!res.ok) throw new Error('Errore caricamento menu');
    return await res.json();
  } catch (e) {
    console.error(e);
    showStatus('Errore nel caricamento del menu');
    return [];
  }
}
async function addMealToMenu(mealId, prezzo) {
  try {
    const payload = { mealId };
    if (prezzo != null) payload.prezzo = prezzo;

    const res = await fetch('/api/my-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Errore aggiunta piatto');
    return await res.json();
  } catch (e) {
    console.error(e);
    showStatus('Errore aggiunta piatto');
    return null;
  }
}
async function removeMealFromMenu(itemId) {
  try {
    const res = await fetch(`/api/my-menu/${itemId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Errore rimozione piatto');
    return true;
  } catch (e) {
    console.error(e);
    showStatus('Errore rimozione piatto');
    return false;
  }
}

function renderCards(meals, selected) {
  const grid = document.getElementById('cards');
  if (!grid) {
    console.error('Elemento #cards non trovato nel DOM.');
    return;
  }
  grid.innerHTML = meals.map(m => cardHTML(m, selected.has(m._id))).join('');
}

function cardHTML(meal, isAdded) {
  const id   = meal._id;
  const name = meal.nome ?? meal.name ?? meal.strMeal ?? 'Senza nome';
  const foto = meal.foto ?? meal.image ?? meal.thumb ?? meal.strMealThumb ?? '';

  if (isAdded) {
    return `
      <div class="meal-card added" data-id="${id}">
        ${foto ? `<img class="meal-thumb" src="${foto}" alt="${escapeHtml(name)}" loading="lazy">` : ''}
        <h3>
          <span class="meal-title">${escapeHtml(name)}</span>
          <button class="btn-remove-inline" type="button" title="Rimuovi">−</button>
        </h3>
      </div>
    `;
  }
  return `
    <div class="meal-card" data-id="${id}">
      ${foto ? `<img class="meal-thumb" src="${foto}" alt="${escapeHtml(name)}" loading="lazy">` : ''}
      <h3><span class="meal-title">${escapeHtml(name)}</span></h3>
    </div>
  `;
}

const mealModal         = document.getElementById('meal-modal');
const modalImg          = document.getElementById('modal-img');
const modalTitle        = document.getElementById('modal-title');
const modalDesc         = document.getElementById('modal-desc');
const modalCategory     = document.getElementById('modal-category');
const modalArea         = document.getElementById('modal-area');
const modalTags         = document.getElementById('modal-tags');
const modalInstructions = document.getElementById('modal-instructions');
const modalIngredients  = document.getElementById('modal-ingredients');
const modalMeasures     = document.getElementById('modal-measures');
const modalYoutube      = document.getElementById('modal-youtube');
const modalSourceA      = document.getElementById('modal-source');
const modalAddBtn       = document.getElementById('modal-add-btn');
const modalRemoveBtn    = document.getElementById('modal-remove-btn');
const modalPriceSection = document.getElementById('modal-price-section');
const modalPriceInput   = document.getElementById('modal-price-input');
const modalPriceConfirm = document.getElementById('modal-price-confirm');
const modalPriceCancel  = document.getElementById('modal-price-cancel');
const modalPriceError   = document.getElementById('modal-price-error');

let   currentMealId = null;

function renderList(ul, arr) {
  if (!ul) return;
  ul.innerHTML = '';
  (arr || []).forEach(v => {
    v = (v || '').toString().trim();
    if (!v) return;
    const li = document.createElement('li');
    li.textContent = v;
    ul.appendChild(li);
  });
}
function renderTags(el, tags) {
  if (!el) return;
  el.innerHTML = '';
  
  let list;
  if (Array.isArray(tags)) {
    list = tags.flatMap(tag => {
      if (typeof tag === 'string' && tag.includes(',')) {
        return tag.split(',').map(t => t.trim());
      }
      return [tag];
    });
  } else {
    const tagsString = String(tags || '');
    list = tagsString.split(',');
  }
  
  const processedTags = list.map(t => t.trim()).filter(Boolean);
  
  processedTags.forEach(t => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    el.appendChild(span);
  });
}
function buildYouTubeUrl(val = '') {
  const s = String(val || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) {
    const m1 = s.match(/[?&]v=([^&]+)/i);
    if (m1) return `https://www.youtube.com/watch?v=${m1[1]}`;
    const m2 = s.match(/youtu\.be\/([^?&]+)/i);
    if (m2) return `https://www.youtube.com/watch?v=${m2[1]}`;
    const m3 = s.match(/youtube\.com\/shorts\/([^?&]+)/i);
    if (m3) return `https://www.youtube.com/watch?v=${m3[1]}`;
    return s;
  }
  return `https://www.youtube.com/watch?v=${s}`;
}
function setSourceLink(source) {
  if (!modalSourceA) return;
  if (source) {
    modalSourceA.href = source;
    modalSourceA.classList.remove('hidden');
  } else {
    modalSourceA.removeAttribute('href');
    modalSourceA.classList.add('hidden');
  }
}

function extractIngsMeas(m) {
  let ingredients = Array.isArray(m.ingredients) ? m.ingredients : [];
  let measures    = Array.isArray(m.measures) ? m.measures : [];
  if ((!ingredients.length && !measures.length) && m.strIngredient1) {
    ingredients = []; measures = [];
    for (let i = 1; i <= 20; i++) {
      const ing = (m[`strIngredient${i}`] || '').trim();
      const mea = (m[`strMeasure${i}`] || '').trim();
      if (ing) ingredients.push(ing);
      if (mea) measures.push(mea);
    }
  }
  return { ingredients, measures };
}

function openMealModalFromMeal(meal) {
  if (!meal || !mealModal) return;

  currentMealId = meal._id;



  const title = meal.nome ?? meal.name ?? meal.strMeal ?? 'Senza nome';
  const img   = meal.foto ?? meal.image ?? meal.thumb ?? meal.strMealThumb ?? '';
  const desc  = meal.descrizione ?? meal.description ?? '';
  const category = meal.category ?? meal.strCategory ?? '';
  const area     = meal.area ?? meal.strArea ?? '';
  const instructions = meal.instructions ?? meal.strInstructions ?? '';
  const tags = Array.isArray(meal.tags) ? meal.tags
              : Array.isArray(meal.strTags) ? meal.strTags
              : (meal.tags ?? meal.strTags ?? '');
  const { ingredients, measures } = extractIngsMeas(meal);

  modalTitle.textContent = title;
  modalImg.src = img || '';
  modalImg.alt = title || '';
  modalCategory.textContent = category || '';
  modalArea.textContent = area || '';
  modalDesc.textContent = desc || '';
  modalInstructions.textContent = instructions || '';
  renderTags(modalTags, tags);
  renderList(modalIngredients, ingredients);
  renderList(modalMeasures, measures);

  if (modalYoutube) {
    const yt = buildYouTubeUrl(meal.strYoutube || meal.youtube || '');
    if (yt) {
      modalYoutube.href = yt;
      modalYoutube.classList.remove('hidden');
    } else {
      modalYoutube.href = '#';
      modalYoutube.classList.add('hidden');
    }
  }

  setSourceLink(meal.strSource || meal.source || meal.url || meal.link || '');

  if (modalAddBtn && modalRemoveBtn) {
    if (selectedIds.has(currentMealId)) {
      modalAddBtn.classList.add('hidden');
      modalRemoveBtn.classList.remove('hidden');
    } else {
      modalAddBtn.classList.remove('hidden');
      modalRemoveBtn.classList.add('hidden');
    }
  }

  if (modalPriceSection) {
    modalPriceSection.classList.add('hidden');
    if (modalPriceInput) modalPriceInput.value = '';
    if (modalPriceError) modalPriceError.textContent = '';
  }

  mealModal.classList.remove('hidden');
  mealModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', onEscClose);

  setTimeout(() => {
    const modalScroll = mealModal.querySelector('.modal-scroll');
    if (modalScroll) {
      modalScroll.scrollTop = 0;
    }
  }, 10);
}
function closeMealModal() {
  if (!mealModal) return;
  
  const modalScroll = mealModal.querySelector('.modal-scroll');
  if (modalScroll) {
    modalScroll.scrollTop = 0;
  }
  
  mealModal.classList.add('hidden');
  mealModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', onEscClose);
  setSourceLink(null);
}
function onEscClose(e) { if (e.key === 'Escape') closeMealModal(); }

function parseEuroToNumber(s) {
  const clean = String(s || '').replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = parseFloat(clean);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

modalAddBtn?.addEventListener('click', () => {
  modalPriceSection.classList.remove('hidden');
  modalPriceInput.focus();
});

modalRemoveBtn?.addEventListener('click', async () => {
  if (!currentMealId) return;
  
  const itemId = itemIdByMealId.get(currentMealId);
  if (!itemId) return showStatus('Item non trovato per questo piatto');

  const ok = await removeMealFromMenu(itemId);
  if (!ok) return;

  selectedIds.delete(currentMealId);
  itemIdByMealId.delete(currentMealId);

  const meal = allMeals.find(m => m._id === currentMealId);
  const card = document.querySelector(`.meal-card[data-id="${CSS.escape(currentMealId)}"]`);
  if (meal && card) card.outerHTML = cardHTML(meal, false);

  closeMealModal();
});

modalPriceConfirm?.addEventListener('click', async () => {
  modalPriceError.textContent = '';
  const val = parseEuroToNumber(modalPriceInput.value);
  
  if (!(val >= 0)) {
    modalPriceError.textContent = 'Inserisci un prezzo valido (es. 8,50).';
    modalPriceInput.focus();
    return;
  }

  modalPriceConfirm.disabled = true;
  modalPriceConfirm.textContent = 'Salvo...';

  const menuAfter = await addMealToMenu(currentMealId, val);

  modalPriceConfirm.disabled = false;
  modalPriceConfirm.textContent = 'Conferma';

  if (!menuAfter) {
    modalPriceError.textContent = 'Errore durante il salvataggio.';
    return;
  }

  const newItem = menuAfter.find(x => x.meal && (x.meal._id === currentMealId || x.meal === currentMealId));
  if (newItem) itemIdByMealId.set(currentMealId, newItem._id);
  selectedIds.add(currentMealId);

  const meal = allMeals.find(m => m._id === currentMealId);
  const card = document.querySelector(`.meal-card[data-id="${CSS.escape(currentMealId)}"]`);
  if (meal && card) card.outerHTML = cardHTML(meal, true);

  closeMealModal();
});

modalPriceCancel?.addEventListener('click', () => {
  modalPriceSection.classList.add('hidden');
  modalPriceInput.value = '';
  modalPriceError.textContent = '';
});

modalPriceInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    modalPriceConfirm.click();
  }
});

mealModal?.addEventListener('click', (e) => {
  if (e.target.matches('[data-close], .modal-backdrop')) closeMealModal();
});



document.addEventListener('click', async (e) => {
  const removeBtn = e.target.closest('.btn-remove-inline');
  if (removeBtn) {
    e.preventDefault(); e.stopPropagation();
    const card = removeBtn.closest('.meal-card');
    if (!card) return;
    const mealId = card.dataset.id;
    const itemId = itemIdByMealId.get(mealId);
    if (!itemId) return showStatus('Item non trovato per questo piatto');

    const ok = await removeMealFromMenu(itemId);
    if (!ok) return;

    selectedIds.delete(mealId);
    itemIdByMealId.delete(mealId);

    const meal = allMeals.find(m => m._id === mealId);
    card.outerHTML = cardHTML(meal, false);
    return;
  }



  const card = e.target.closest('.meal-card');
  if (!card) return;
  const mealId = card.dataset.id;
  const meal = allMeals.find(m => m._id === mealId);
  if (meal) {
    e.preventDefault();
    openMealModalFromMeal(meal);
  }
}, true);

function showStatus(msg) {
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => (el.textContent = ''), 3000);
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[s])
  );
}
