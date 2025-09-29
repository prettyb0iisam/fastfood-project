const API_BASE = '';

function selezionaTipo(tipo) {
  document.getElementById('box-cliente').classList.remove('selected');
  document.getElementById('box-ristoratore').classList.remove('selected');
  document.getElementById('form-cliente').style.display = 'none';
  document.getElementById('form-ristoratore').style.display = 'none';

  if (tipo === 'cliente') {
    document.getElementById('box-cliente').classList.add('selected');
    document.getElementById('form-cliente').style.display = 'flex';
  } else {
    document.getElementById('box-ristoratore').classList.add('selected');
    document.getElementById('form-ristoratore').style.display = 'flex';
    
    const statusDiv = document.getElementById('restaurantStatus');
    const fieldsDiv = document.getElementById('restaurantFields');
    const telefonoInput = document.getElementById('numeroTelefono');
    const pivaInput = document.getElementById('partitaIVA');
    const indirizzoInput = document.getElementById('indirizzoRistorante');
    
    statusDiv.textContent = '';
    statusDiv.className = 'restaurant-status';
    fieldsDiv.className = 'restaurant-fields';
    
    telefonoInput.value = '';
    pivaInput.value = '';
    indirizzoInput.value = '';
    telefonoInput.readOnly = false;
    pivaInput.readOnly = false;
    indirizzoInput.readOnly = false;
  }
}

async function handleSubmit(e, formId, errorId) {
  e.preventDefault();
  const form = document.getElementById(formId);
  const data = Object.fromEntries(new FormData(form));
  if (formId === 'form-cliente') {
    data.preferenze = Array.from(selectedPreferences);
  }

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const json = await res.json();

    if (!res.ok) {
      document.getElementById(errorId).textContent = json.msg || 'Errore nella registrazione';
    } else {
      window.location.href = '/login';
    }
  } catch {
    document.getElementById(errorId).textContent = 'Errore nella richiesta';
  }
}

let allTags = [];
let selectedPreferences = new Set();

function togglePreferences() {
  const container = document.getElementById('preferences-container');
  const toggleIcon = document.querySelector('.toggle-icon');
  
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    toggleIcon.textContent = '▲';
    loadAvailableTags();
  } else {
    container.classList.add('hidden');
    toggleIcon.textContent = '▼';
  }
}

async function loadAvailableTags() {
  const loadingDiv = document.querySelector('.preferences-loading');
  const tagsDiv = document.getElementById('preferences-tags');
  
  try {
    const response = await fetch(`${API_BASE}/api/available-tags`);
    if (!response.ok) throw new Error('Errore nel caricamento dei tag');
    
    allTags = await response.json();
    loadingDiv.style.display = 'none';
    renderPreferencesTags();
  } catch (error) {
    console.error('Errore nel caricamento dei tag:', error);
    loadingDiv.textContent = 'Errore nel caricamento delle preferenze';
  }
}

function renderPreferencesTags() {
  const tagsDiv = document.getElementById('preferences-tags');
  tagsDiv.innerHTML = '';
  
  allTags.forEach(tag => {
    const tagElement = document.createElement('div');
    tagElement.className = 'preference-tag';
    tagElement.textContent = tag;
    tagElement.onclick = () => togglePreference(tag, tagElement);
    tagsDiv.appendChild(tagElement);
  });
}

function togglePreference(tag, element) {
  if (selectedPreferences.has(tag)) {
    selectedPreferences.delete(tag);
    element.classList.remove('selected');
  } else {
    selectedPreferences.add(tag);
    element.classList.add('selected');
  }
}

async function cercaRistorante(nomeRistorante) {
  const statusDiv = document.getElementById('restaurantStatus');
  const fieldsDiv = document.getElementById('restaurantFields');
  
  if (!nomeRistorante || nomeRistorante.trim().length < 2) {
    statusDiv.textContent = '';
    statusDiv.className = 'restaurant-status';
    fieldsDiv.className = 'restaurant-fields';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/find-restaurant/${encodeURIComponent(nomeRistorante.trim())}`);
    
    if (response.ok) {
      const datiRistorante = await response.json();
    
      statusDiv.textContent = 'Ristorante Trovato';
      statusDiv.className = 'restaurant-status visible found';
      
      fieldsDiv.className = 'restaurant-fields visible';
      
      const telefonoInput = document.getElementById('numeroTelefono');
      const pivaInput = document.getElementById('partitaIVA');
      const indirizzoInput = document.getElementById('indirizzoRistorante');
      
      telefonoInput.value = datiRistorante.numeroTelefono || '';
      pivaInput.value = datiRistorante.partitaIVA || '';
      indirizzoInput.value = datiRistorante.indirizzo || '';
      
       if (datiRistorante.readonly) {
         fieldsDiv.classList.add('readonly');
         telefonoInput.readOnly = true;
         pivaInput.readOnly = true;
         indirizzoInput.readOnly = true;
         statusDiv.textContent = 'Ristorante Trovato';
       } else {
        fieldsDiv.classList.remove('readonly');
        telefonoInput.readOnly = false;
        pivaInput.readOnly = false;
        indirizzoInput.readOnly = false;
      }
             } else {
       statusDiv.textContent = 'Nuovo Ristorante';
       statusDiv.className = 'restaurant-status visible not-found';
      
      fieldsDiv.className = 'restaurant-fields visible';
      const telefonoInput = document.getElementById('numeroTelefono');
      const pivaInput = document.getElementById('partitaIVA');
      const indirizzoInput = document.getElementById('indirizzoRistorante');
      
      telefonoInput.value = '';
      pivaInput.value = '';
      indirizzoInput.value = '';
      
      fieldsDiv.classList.remove('readonly');
      telefonoInput.readOnly = false;
      pivaInput.readOnly = false;
      indirizzoInput.readOnly = false;
    }
  } catch (error) {
    console.error('Errore nella ricerca del ristorante:', error);
    statusDiv.textContent = 'Errore nella ricerca - Inserisci i dati manualmente';
    statusDiv.className = 'restaurant-status visible not-found';
    fieldsDiv.className = 'restaurant-fields visible';
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

window.addEventListener('DOMContentLoaded', () => {
  window.selezionaTipo = selezionaTipo;
  window.togglePreferences = togglePreferences;

  document.getElementById('form-cliente')
    .addEventListener('submit', e => handleSubmit(e, 'form-cliente', 'errore-cliente'));

  document.getElementById('form-ristoratore')
    .addEventListener('submit', e => handleSubmit(e, 'form-ristoratore', 'errore-ristoratore'));

  const nomeRistoranteInput = document.getElementById('nomeRistorante');
  const debouncedCercaRistorante = debounce(cercaRistorante, 500);
  
  nomeRistoranteInput.addEventListener('input', (e) => {
    debouncedCercaRistorante(e.target.value);
  });
});
