let utenteCorrente = null;
let editMode = false;
const viewMenuBtn = document.getElementById('viewMenuBtn');
const restaurantOrdersBtn = document.getElementById('restaurantOrdersBtn');
const restaurantHistoryBtn = document.getElementById('restaurantHistoryBtn');
const viewAllMealsBtn = document.getElementById('viewAllMealsBtn');
const viewOpenRestaurantsBtn = document.getElementById('viewOpenRestaurantsBtn');
const ordersBtn = document.getElementById('ordersBtn');
const cartBtn = document.getElementById('cartBtn');
const ordersHistoryBtn = document.getElementById('ordersHistoryBtn');

function createRow(key, value, editable) {
  const row = document.createElement('div');
  row.className = 'row';

  const fieldNames = {
    'metodoPagamento': 'Metodo di Pagamento',
    'preferenze': 'Preferenze',
    'nomeRistorante': 'Ristorante',
    'numeroTelefono': 'Telefono',
    'partitaIVA': 'Partita IVA',
    'indirizzoRistorante': 'Indirizzo'
  };

  if (key === 'preferenze' && utenteCorrente?.tipo === 'ristoratore') {
    return null;
  }

  const label = document.createElement('div');
  label.className = 'cell-label';
  label.textContent = (fieldNames[key] || key) + ':';

  const valueCell = document.createElement('div');
  valueCell.className = 'cell-value';

  const isRestaurantField = ['nomeRistorante', 'numeroTelefono', 'partitaIVA', 'indirizzoRistorante'].includes(key);
  const shouldBeReadonly = isRestaurantField && utenteCorrente?.tipo === 'ristoratore' && !utenteCorrente.isRestaurantCreator;

  if (editable) {
    if (key === 'metodoPagamento') {
      const select = document.createElement('select');
      select.name = key;
      select.className = 'profilo-input';
      select.required = true;

      const opzioni = [
        'Carta di credito',
        'Carta di debito',
        'Carta prepagata',
        'Contanti',
        'Pagamento Digitale'
      ];

      opzioni.forEach(opt => {
        const optionEl = document.createElement('option');
        optionEl.value = opt;
        optionEl.textContent = opt;
        if (opt === value) optionEl.selected = true;
        select.appendChild(optionEl);
      });

      valueCell.appendChild(select);
    } else if (key === 'preferenze') {
      const preferencesContainer = document.createElement('div');
      preferencesContainer.className = 'preferences-tags';
      
      const preferences = Array.isArray(value) ? value : (value ? value.split(',').map(p => p.trim()) : []);
      
      loadAvailableTagsForEdit(preferencesContainer, preferences);
      
      valueCell.appendChild(preferencesContainer);
    } else if (key !== 'tipo') {
      const input = document.createElement('input');
      input.className = 'profilo-input';
      input.name = key;
      if (key === 'email') input.type = 'email';
      else if (key === 'numeroTelefono') input.type = 'tel';
      else input.type = 'text';
      input.value = (value ?? '').toString();
      
      if (shouldBeReadonly) {
        input.readOnly = true;
        input.style.backgroundColor = '#f8f9fa';
        input.style.color = '#6c757d';
        input.style.cursor = 'not-allowed';
      }
      
      if (key === 'nomeRistorante') {
        const debouncedCercaRistorante = debounce(cercaRistorante, 500);
        input.addEventListener('input', (e) => {
          debouncedCercaRistorante(e.target.value);
        });
      }
      
      valueCell.appendChild(input);
    } else {
      valueCell.textContent = (value ?? '').toString();
    }
  } else {
    if (key === 'preferenze') {
      const preferencesContainer = document.createElement('div');
      preferencesContainer.className = 'preferences-tags';
      
      const preferences = Array.isArray(value) ? value : (value ? value.split(',').map(p => p.trim()) : []);
      
      console.log('Processing preferenze:', key, value, preferences);
      
      preferences.forEach(pref => {
        if (pref && pref.trim()) {
          const prefTag = document.createElement('div');
          prefTag.className = 'preference-tag selected';
          prefTag.textContent = pref.trim();
          
          preferencesContainer.appendChild(prefTag);
        }
      });
      
      valueCell.appendChild(preferencesContainer);
    } else {
      valueCell.textContent = (value ?? '').toString();
    }
  }

  row.appendChild(label);
  row.appendChild(valueCell);
  return row;
}

async function cercaRistorante(nomeRistorante) {
  if (!nomeRistorante || nomeRistorante.trim().length < 2) {
    return;
  }

  try {
    const response = await fetch(`/api/find-restaurant/${encodeURIComponent(nomeRistorante.trim())}`);
    
    if (response.ok) {
      const datiRistorante = await response.json();
      
      const numeroTelefonoInput = document.querySelector('input[name="numeroTelefono"]');
      const partitaIVAInput = document.querySelector('input[name="partitaIVA"]');
      const indirizzoRistoranteInput = document.querySelector('input[name="indirizzoRistorante"]');
      
      if (numeroTelefonoInput) numeroTelefonoInput.value = datiRistorante.numeroTelefono || '';
      if (partitaIVAInput) partitaIVAInput.value = datiRistorante.partitaIVA || '';
      if (indirizzoRistoranteInput) indirizzoRistoranteInput.value = datiRistorante.indirizzo || '';
    }
  } catch (error) {
    console.error('Errore nella ricerca del ristorante:', error);
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function renderProfilo(editable = false) {
  const container = document.getElementById('dati-utente');
  container.innerHTML = '';

  Object.entries(utenteCorrente).forEach(([key, value]) => {
    if (['_id','__v','password','isRestaurantCreator'].includes(key)) return;
    const row = createRow(key, value, editable);
    if (row) {
      container.appendChild(row);
    }
  });

  document.getElementById('confirmBtn').style.display = editable ? 'inline-block' : 'none';
}

async function caricaProfilo() {
  const res = await fetch('/api/profilo', {
    method: 'GET',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Non sei autenticato');
  utenteCorrente = await res.json();
  console.log('Dati utente caricati:', utenteCorrente);
  
  if (utenteCorrente?.tipo === 'ristoratore' && utenteCorrente.nomeRistorante) {
    try {
      const creatorRes = await fetch(`/api/check-restaurant-creator/${encodeURIComponent(utenteCorrente.nomeRistorante)}`, {
        credentials: 'include'
      });
      if (creatorRes.ok) {
        const creatorData = await creatorRes.json();
        utenteCorrente.isRestaurantCreator = creatorData.isCreator;
        console.log('Creatore ristorante:', creatorData.isCreator);
      }
    } catch (error) {
      console.error('Errore nella verifica creatore ristorante:', error);
      utenteCorrente.isRestaurantCreator = false;
    }
  }
  
  renderProfilo(false);

  if (utenteCorrente?.tipo === 'ristoratore' && utenteCorrente.nomeRistorante) {
    document.getElementById('ristoratore-actions').style.display = 'block';
    
    viewMenuBtn.style.display = 'inline-block';
    viewMenuBtn.onclick = () => {
      const r = utenteCorrente.nomeRistorante.trim();
      window.location.href = `/mymenu?ristorante=${encodeURIComponent(r)}`;
    };
    
    restaurantOrdersBtn.style.display = 'inline-block';
    restaurantOrdersBtn.onclick = () => {
      window.location.href = '/restaurant-orders';
    };
    
    restaurantHistoryBtn.style.display = 'inline-block';
    restaurantHistoryBtn.onclick = () => {
      window.location.href = '/restaurant-history';
    };
    
    const addMealsBtn = document.getElementById('addMealsBtn');
    addMealsBtn.style.display = 'inline-block';
    addMealsBtn.onclick = () => {
      window.location.href = '/menu';
    };
    
    const deleteBtnRistoratore = document.getElementById('deleteBtnRistoratore');
    deleteBtnRistoratore.onclick = async () => {
      const prima = confirm('⚠️ Eliminare definitivamente il profilo?');
      if (!prima) return;
      const seconda = confirm('Confermo: elimina definitivamente.');
      if (!seconda) return;

      try {
        const res = await fetch('/api/profilo', {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Eliminazione fallita');
        window.location.href = '/index';
      } catch (err) {
        document.getElementById('errore').textContent = err.message;
      }
    };
  } else {
    document.getElementById('ristoratore-actions').style.display = 'none';
    viewMenuBtn.style.display = 'none';
    restaurantOrdersBtn.style.display = 'none';
    restaurantHistoryBtn.style.display = 'none';
    const addMealsBtn = document.getElementById('addMealsBtn');
    if (addMealsBtn) addMealsBtn.style.display = 'none';
  }

  if (utenteCorrente?.tipo === 'cliente') {
    document.getElementById('cliente-actions').style.display = 'block';
    
    viewAllMealsBtn.onclick = () => {
      window.location.href = '/all-meals';
    };
    viewOpenRestaurantsBtn.onclick = () => {
      window.location.href = '/restaurants';
    };
    ordersBtn.onclick = () => {
      window.location.href = '/orders';
    };
    cartBtn.onclick = () => {
      window.location.href = '/cart';
    };
    ordersHistoryBtn.onclick = () => {
      window.location.href = '/storico';
    };
  } else {
    document.getElementById('cliente-actions').style.display = 'none';
  }
}

document.getElementById('editBtn').addEventListener('click', () => {
  editMode = !editMode;
  document.getElementById('editBtn').textContent = editMode ? 'Annulla' : 'Edit';
  renderProfilo(editMode);
});

document.getElementById('confirmBtn').addEventListener('click', async () => {
  const inputs = Array.from(document.querySelectorAll('.profilo-input'));
  const payload = {};
  
  inputs.forEach(inp => {
    payload[inp.name] = inp.value;
  });
  
  const selectedPreferences = Array.from(document.querySelectorAll('.preference-tag.selected'))
    .map(tag => tag.dataset.preference);
  payload.preferenze = selectedPreferences;

  try {
    const res = await fetch('/api/profilo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.msg || 'Aggiornamento fallito');
    }
    const data = await res.json();
    utenteCorrente = data.utente || utenteCorrente;
    editMode = false;
    document.getElementById('editBtn').textContent = 'Edit';
    renderProfilo(false);
  } catch (err) {
    document.getElementById('errore').textContent = err.message;
  }
});

document.getElementById('deleteBtn').addEventListener('click', async () => {
  const prima = confirm('Eliminare definitivamente il profilo?');
  if (!prima) return;
  const seconda = confirm('Confermo: elimina definitivamente.');
  if (!seconda) return;

  try {
    const res = await fetch('/api/profilo', {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Eliminazione fallita');
    window.location.href = '/index';
  } catch (err) {
    document.getElementById('errore').textContent = err.message;
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/login';
});

async function loadAvailableTagsForEdit(container, currentPreferences) {
  try {
    const response = await fetch('/api/available-tags');
    if (!response.ok) throw new Error('Errore nel caricamento dei tag');
    
    const allTags = await response.json();
    
    allTags.forEach(tag => {
      const prefTag = document.createElement('div');
      prefTag.className = currentPreferences.includes(tag) ? 'preference-tag selected' : 'preference-tag';
      prefTag.textContent = tag;
      prefTag.dataset.preference = tag;
      prefTag.onclick = function() {
        this.classList.toggle('selected');
      };
      
      container.appendChild(prefTag);
    });
  } catch (error) {
    console.error('Errore nel caricamento dei tag:', error);
    container.innerHTML = '<p style="color: #666;">Errore nel caricamento delle preferenze</p>';
  }
}

caricaProfilo().catch(err => {
  document.getElementById('errore').textContent = err.message;
  setTimeout(() => window.location.href = '/login', 1500);
});