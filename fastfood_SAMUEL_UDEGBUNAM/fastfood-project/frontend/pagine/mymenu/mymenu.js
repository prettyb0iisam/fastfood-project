document.addEventListener('DOMContentLoaded', () => {
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) profileBtn.addEventListener('click', () => {
    window.location.href = '/profile';
  });

  const ordersBtn = document.getElementById('ordersBtn');
  if (ordersBtn) ordersBtn.addEventListener('click', () => {
    window.location.href = '/restaurant-orders';
  });

  const historyBtn = document.getElementById('historyBtn');
  if (historyBtn) historyBtn.addEventListener('click', () => {
    window.location.href = '/restaurant-history';
  });

  const addBtn = document.getElementById('addDishesBtn');
  if (addBtn) addBtn.addEventListener('click', () => {
    window.location.href = '/menu';
  });

  const createBtn = document.getElementById('createDishBtn');
  if (createBtn) createBtn.addEventListener('click', () => {
    const params = new URLSearchParams(window.location.search);
    const ristorante = params.get('ristorante') || '';
    const qs = ristorante ? `?ristorante=${encodeURIComponent(ristorante)}` : '';
    window.location.href = `/newmeal${qs}`;
  });

  const modal = document.getElementById('meal-modal');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');

  const modalCategory = document.getElementById('modal-category');
  const modalArea = document.getElementById('modal-area');
  const modalPrice = document.getElementById('modal-price');
  const modalTags = document.getElementById('modal-tags');
  const modalInstructions = document.getElementById('modal-instructions');
  const modalIngredients = document.getElementById('modal-ingredients');
  const modalMeasures = document.getElementById('modal-measures');

  const modalYoutube = document.getElementById('modal-youtube');
  const sourceA = document.getElementById('modal-source');

  const removeBtn = document.getElementById('mmodal-remove');
  let currentItemId = null;
  const ownerActions = document.getElementById('owner-actions');
  const customerActions = document.getElementById('customer-actions');
  const orderBtn = document.getElementById('order-btn');
  const qtyInput = document.getElementById('order-qty');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');

  function showStatus(msg) {
    const el = document.getElementById('status');
    if (!el) return;
    el.textContent = msg;
    setTimeout(() => (el.textContent = ''), 2500);
  }

  function renderList(ul, arr) {
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

  function onEscClose(e) { if (e.key === 'Escape') closeMealModal(); }

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

  function setSourceLink(data) {
    if (!sourceA) return;
    
    const source =
      data?.strSource || data?.source || data?.link || data?.url ||
      data?.meal?.strSource || data?.meal?.source || data?.meal?.link || data?.meal?.url;

    if (source && source.trim()) {
      sourceA.href = source;
      sourceA.classList.remove('hidden');
      sourceA.classList.add('source-visible');
    } else {
      sourceA.removeAttribute('href');
      sourceA.textContent = '';
      sourceA.classList.remove('source-visible');
      sourceA.classList.add('hidden');
    }
  }

  async function deleteMyMenuItem(itemId) {
    const res = await fetch(`/api/my-menu/${itemId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok && res.status !== 204) throw new Error('Errore rimozione');
    return true;
  }

  function openMealModal(data) {
    const {
      title, img, desc, category, area, instructions,
      tags, ingredients, measures, youtube, source, itemId, mealId 
    } = data || {};

    currentItemId = itemId || null;

    modalTitle.textContent = title || 'Senza nome';
    modalImg.src = img || '';
    modalImg.alt = title || '';
    modalCategory.textContent = category || '';
    modalArea.textContent = area || '';
    modalDesc.textContent = desc || '';
    modalInstructions.textContent = (instructions || '');

    if (modalPrice && data.prezzo != null) {
      modalPrice.textContent = `€${Number(data.prezzo).toFixed(2)}`;
      modalPrice.style.display = 'block';
    } else if (modalPrice) {
      modalPrice.style.display = 'none';
    }

    modal.dataset.itemId = itemId || '';
    modal.dataset.mealId = mealId || '';

    renderTags(modalTags, tags);
    renderList(modalIngredients, ingredients);
    renderList(modalMeasures, measures);

    if (modalYoutube) {
      const yt = buildYouTubeUrl(youtube || '');
      if (yt) {
        modalYoutube.href = yt;
        modalYoutube.classList.remove('hidden');
      } else {
        modalYoutube.href = '#';
        modalYoutube.classList.add('hidden');
      }
    }

    setSourceLink({ source });

    const isOwnerUI = !!document.getElementById('createDishBtn');
    ownerActions?.classList.toggle('hidden', !isOwnerUI);
    customerActions?.classList.toggle('hidden', !!isOwnerUI);
    
    modal.classList.toggle('meal-created', isOwnerUI);

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onEscClose);
    
    const modalPanel = modal.querySelector('.modal-panel');
    if (modalPanel) {
      modalPanel.scrollTop = 0;
    }
  }

  function closeMealModal() {
    if (window.isEditing) {
      const cancelBtn = document.getElementById('mmodal-cancel');
      if (cancelBtn) {
        cancelBtn.click();
      }
    }
    
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onEscClose);
    setSourceLink({});
    currentItemId = null;
  }

  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close], .modal-backdrop')) closeMealModal();
  });

  qtyMinus?.addEventListener('click', ()=>{
    const v = Math.max(1, (parseInt(qtyInput.value,10)||1)-1);
    qtyInput.value = String(v);
  });
  qtyPlus?.addEventListener('click', ()=>{
    const v = Math.max(1, (parseInt(qtyInput.value,10)||1)+1);
    qtyInput.value = String(v);
  });
  orderBtn?.addEventListener('click', async ()=>{
    try {
      const qty = parseInt(qtyInput.value, 10) || 1;
      const currentData = window.modalData.find(item => item.itemId === currentItemId);
      
      if (!currentData) {
        showStatus('Errore: dati piatto non trovati');
        return;
      }

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          restaurantName: currentData.restaurantName,
          itemId: currentItemId,
          mealId: currentData.mealId,
          qty: qty
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Errore nell\'aggiunta al carrello');
      }

      const result = await response.json();
      showStatus(`Aggiunto al carrello: ${qty}x ${currentData.title}`);
      
      closeMealModal();
      
    } catch (error) {
      console.error('Errore aggiunta al carrello:', error);
      showStatus('Errore nell\'aggiunta al carrello: ' + error.message);
    }
  });

  const params = new URLSearchParams(window.location.search);
  const ristorante = params.get('ristorante');
  const titleEl = document.getElementById('restaurant-title');
  titleEl.textContent = `Menu di ${ristorante || '—'}`;

  if (!ristorante) {
    document.getElementById('menu-container').textContent = 'Parametro ristorante mancante';
    return;
  }

  const url = `/api/menu/${encodeURIComponent(ristorante)}`;

  window.modalData = [];
  const modalData = window.modalData;

  fetch(url, { credentials: 'include' })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(menu => {
      const c = document.getElementById('menu-container');
      c.className = 'grid-meals';
      c.innerHTML = '';

      if (!Array.isArray(menu) || menu.length === 0) {
        c.textContent = 'Non sono presenti piatti nel menu.';
        return;
      }

      const frag = document.createDocumentFragment();

function extractIngredientsFromMeal(m) {
  const out = [];
  for (let i = 1; i <= 20; i++) {
    const v = (m[`strIngredient${i}`] || '').trim();
    if (v) out.push(v);
  }
  return out;
}
function extractMeasuresFromMeal(m) {
  const out = [];
  for (let i = 1; i <= 20; i++) {
    const v = (m[`strMeasure${i}`] || '').trim();
    if (v) out.push(v);
  }
  return out;
}

menu.forEach((item) => {
  const m = item.meal || item.mealId || {};

  const titolo = item.nome || m.name || m.strMeal || 'Piatto';
  const img    = m.thumbnail || m.strMealThumb || m.image || m.foto || '';
  const desc   = item.descrizione || m.description || '';
  const prezzo = (item.prezzo != null) ? '€' + Number(item.prezzo).toFixed(2) : '';

  const category     = item.strCategory     || m.strCategory || m.category || '';
  const area         = item.strArea         || m.strArea     || m.area     || '';
  const instructions = item.hasOwnProperty('strInstructions') ? item.strInstructions : (m.strInstructions || m.instructions || '');

  let tags = item.strTags ?? m.strTags ?? m.tags ?? '';
  tags = Array.isArray(tags)
    ? tags
    : String(tags || '').split(',').map(t => t.trim()).filter(Boolean);

  let ingredients = [];
  if (Array.isArray(item.ingredients)) {
    ingredients = item.ingredients;
  } else if (Array.isArray(m.ingredients) && m.ingredients.length) {
    ingredients = m.ingredients;
  } else if (m.strIngredient1) {
    ingredients = extractIngredientsFromMeal(m);
  }

  let measures = [];
  if (Array.isArray(item.measures)) {
    measures = item.measures;
  } else if (Array.isArray(m.measures) && m.measures.length) {
    measures = m.measures;
  } else if (m.strMeasure1 || m.strIngredient1) {
    measures = extractMeasuresFromMeal(m);
  }

  const youtube = item.hasOwnProperty('youtube') ? item.youtube : (m.strYoutube || m.youtube || '');
  const source = item.hasOwnProperty('source') ? item.source : (m.strSource || m.source || m.url || item.url || item.link || '');

  const mealId = m._id || m.idMeal || '';

  const data = {
    title: titolo,
    img,
    desc: desc || '',
    category,
    area,
    instructions,
    tags,
    ingredients,
    measures,
    youtube,
    source,
    itemId: item._id,
    mealId,
    prezzo: item.prezzo,
    restaurantName: ristorante
  };
  const dataIndex = modalData.push(data) - 1;

  const card = document.createElement('div');
  card.className = 'meal-card' + (item.attivo === false ? '' : ' attivo');
  card.dataset.idx = String(dataIndex);
  card.dataset.itemId = String(item._id);
  card.innerHTML = `
    <img class="meal-thumb" src="${img}" alt="${titolo}">
    <div class="meal-body">
      <h3 class="meal-title">${titolo}</h3>
      <div class="meal-price">${prezzo}</div>
      ${desc ? `<p class="meal-desc">${desc}</p>` : ''}
    </div>
  `;
  frag.appendChild(card);
});


      const ciao = document.getElementById('menu-container');
      ciao.appendChild(frag);

      ciao.addEventListener('click', (e) => {
        const card = e.target.closest('.meal-card');
        if (!card) return;
        const idx = Number(card.dataset.idx);
        const data = modalData[idx];
        if (data) {
          modal.dataset.idx = String(idx);
          openMealModal(data);
        }
      });
    })
    .catch(err => {
      console.error('ERR FETCH:', err);
      document.getElementById('menu-container').textContent = 'Menu non trovato';
    });

  removeBtn?.addEventListener('click', async () => {
    if (!currentItemId) return;

    try {
      await deleteMyMenuItem(currentItemId);

      const card = document.querySelector(`.meal-card[data-item-id="${CSS.escape(currentItemId)}"]`);
      card?.remove();

             closeMealModal();
    } catch (e) {
      console.error(e);
      showStatus('Errore rimozione piatto');
    }
  });
});
