document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('newmeal-form');
  const statusEl = document.getElementById('status');
  const cancelBtn = document.getElementById('nm-cancel');
  const fileInput = document.getElementById('nm-image');
  const previewImg = document.getElementById('nm-preview');
  const placeholder = document.getElementById('nm-placeholder');
  const imgFrame = document.getElementById('img-frame');


  const profileBtn = document.getElementById('profileBtn');
  const viewMenuBtn = document.getElementById('viewMenuBtn');
  const addMealsBtn = document.getElementById('addMealsBtn');
  const historyBtn = document.getElementById('historyBtn');
  const ordersBtn = document.getElementById('ordersBtn');

  const params = new URLSearchParams(window.location.search);
  const ristorante = params.get('ristorante') || '';

  function setStatus(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    if (msg) setTimeout(() => (statusEl.textContent = ''), 2500);
  }


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

  const $ = (id) => document.getElementById(id);
  function cleanList(value) {
    return String(value || '')
      .split(/\r?\n|,/g)
      .map(s => s.trim())
      .filter(Boolean);
  }


  profileBtn?.addEventListener('click', () => {
    window.location.href = '/profile';
  });

  viewMenuBtn?.addEventListener('click', async () => {
    const restaurantName = await fetchRestaurantName();
    if (restaurantName) {
      const encodedName = encodeURIComponent(restaurantName);
      window.location.href = `/mymenu?ristorante=${encodedName}`;
    } else {
      setStatus('Errore: impossibile ottenere il nome del ristorante');
    }
  });

  addMealsBtn?.addEventListener('click', () => {
    window.location.href = '/menu';
  });

  historyBtn?.addEventListener('click', () => {
    window.location.href = '/restaurant-history';
  });

  ordersBtn?.addEventListener('click', () => {
    window.location.href = '/restaurant-orders';
  });

  cancelBtn?.addEventListener('click', () => {
    const qs = ristorante ? `?ristorante=${encodeURIComponent(ristorante)}` : '';
    window.location.href = `/mymenu${qs}`;
  });


  imgFrame?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      previewImg?.classList.add('hidden');
      placeholder?.classList.remove('hidden');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (previewImg) {
        previewImg.src = reader.result;
        previewImg.classList.remove('hidden');
      }
      placeholder?.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const title = $('nm-title').value.trim();
    const price = $('nm-price').value.trim();
    if (!title || price === '') {
      setStatus('Titolo e prezzo sono obbligatori');
      return;
    }

    const formData = new FormData();
    formData.append('custom', 'true');
    formData.append('nome', title);
    formData.append('prezzo', String(Number(price)));
    formData.append('strCategory', $('nm-category').value.trim());
    formData.append('strArea', $('nm-area').value.trim());
    formData.append('strInstructions', $('nm-instructions').value.trim());
    cleanList($('nm-tags').value).forEach(v => formData.append('strTags[]', v));
    cleanList($('nm-ings').value).forEach(v => formData.append('ingredients[]', v));
    cleanList($('nm-meas').value).forEach(v => formData.append('measures[]', v));

    const yt = $('nm-youtube').value.trim();
    if (yt) formData.append('youtube', yt);
    const src = $('nm-source').value.trim();
    if (src) formData.append('source', src);
    const file = $('nm-image').files && $('nm-image').files[0];
    if (file) formData.append('image', file);

    try {
      const res = await fetch('/api/my-menu', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const qs = ristorante ? `?ristorante=${encodeURIComponent(ristorante)}` : '';
      window.location.href = `/mymenu${qs}`;
    } catch (err) {
      console.error(err);
      setStatus('Errore salvataggio piatto');
    }
  });
});