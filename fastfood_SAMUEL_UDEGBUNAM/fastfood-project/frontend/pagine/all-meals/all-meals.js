document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('cards');
  const statusEl = document.getElementById('status');
  const modal = document.getElementById('avail-modal');
  const amImg = document.getElementById('am-img');
  const amTitle = document.getElementById('am-title');
  const amSource = document.getElementById('am-source');
  const amYoutube = document.getElementById('am-youtube');
  const amCategory = document.getElementById('am-category');
  const amArea = document.getElementById('am-area');
  const amDesc = document.getElementById('am-desc');
  const amInstructions = document.getElementById('am-instructions');
  const amTags = document.getElementById('am-tags');
  const amIngredients = document.getElementById('am-ingredients');
  const amMeasures = document.getElementById('am-measures');
  const amOrder = document.getElementById('am-order');
  const orderConfirmation = document.getElementById('order-confirmation');
  const cartBtn = document.getElementById('cartBtn');
  
  const searchInput = document.getElementById('search-input');
  const preferencesFilterBtn = document.getElementById('preferences-filter-btn');
  const categoryFilterBtn = document.getElementById('category-filter-btn');
  const categoryDropdown = document.getElementById('category-dropdown');
  const categoryBadges = document.getElementById('category-badges');
  const noPreferencesMessage = document.getElementById('no-preferences-message');
  
  const priceFilterBtn = document.getElementById('price-filter-btn');
  const priceSliderContainer = document.getElementById('price-slider-container');
  const priceSlider = document.getElementById('price-slider');
  const priceValue = document.getElementById('price-value');
  
  let allMeals = [];
  let userPreferences = [];
  let availableCategories = [];
  let selectedCategories = new Set();
  let isPreferencesFilterActive = false;
  let isCategoryFilterActive = false;
  let isPriceFilterActive = false;
  let maxPrice = 100;
  let currentPriceFilter = 100;


  function setStatus(m){ if(statusEl){ statusEl.textContent=m||''; if(m) setTimeout(()=>statusEl.textContent='',2000); } }
  
  function filterMeals(searchTerm) {
    applyAllFilters();
  }

  async function loadUserPreferences() {
    try {
      const response = await fetch('/api/profilo', {
        credentials: 'include'
      });
      if (response.ok) {
        const user = await response.json();
        userPreferences = user.preferenze || [];
      }
    } catch (error) {
      console.error('Errore caricamento preferenze:', error);
    }
  }

  function loadAvailableCategoriesFromMeals() {
    const categories = new Set();
    
    allMeals.forEach(meal => {
      const category = meal.data.category;
      if (category && category.trim()) {
        categories.add(category.trim());
      }
    });
    
    availableCategories = Array.from(categories).sort();
    renderCategoryBadges();
  }

  function calculatePriceRange() {
    let min = Infinity;
    let max = 0;
    
    allMeals.forEach(meal => {
      const price = meal.data.currentRestaurant.prezzo;
      if (price) {
        if (price < min) min = price;
        if (price > max) max = price;
      }
    });
    
    if (min === Infinity) {
      min = 0;
      max = 100;
    }
    
    const minPrice = Math.floor(min);
    maxPrice = Math.ceil(max);
    currentPriceFilter = maxPrice;
    
    if (priceSlider) {
      priceSlider.min = minPrice;
      priceSlider.max = maxPrice;
      priceSlider.value = maxPrice;
      updatePriceDisplay(maxPrice);
    }
  }

  function updatePriceDisplay(price) {
    if (priceValue) {
      priceValue.textContent = `€${price.toFixed(2)}`;
    }
  }

  function renderCategoryBadges() {
    categoryBadges.innerHTML = '';
    availableCategories.forEach(category => {
      const badge = document.createElement('div');
      badge.className = 'category-badge';
      badge.textContent = category;
      badge.dataset.category = category;
      
      badge.addEventListener('click', () => {
        toggleCategoryFilter(category, badge);
      });
      
      categoryBadges.appendChild(badge);
    });
  }

  function toggleCategoryFilter(category, badge) {
    if (selectedCategories.has(category)) {
      selectedCategories.delete(category);
      badge.classList.remove('selected');
    } else {
      selectedCategories.add(category);
      badge.classList.add('selected');
    }
    
    applyAllFilters();
  }

  function toggleCategoryDropdown() {
    if (categoryDropdown.classList.contains('hidden')) {
      categoryDropdown.classList.remove('hidden');
      categoryFilterBtn.classList.add('active');
      isCategoryFilterActive = true;
    } else {
      categoryDropdown.classList.add('hidden');
      categoryFilterBtn.classList.remove('active');
      isCategoryFilterActive = false;
      selectedCategories.clear();
      categoryBadges.querySelectorAll('.category-badge').forEach(badge => {
        badge.classList.remove('selected');
      });
      applyAllFilters();
    }
  }

  function togglePriceFilter() {
    if (priceSliderContainer.classList.contains('hidden')) {
      priceSliderContainer.classList.remove('hidden');
      priceFilterBtn.classList.add('active');
      isPriceFilterActive = true;
    } else {
      priceSliderContainer.classList.add('hidden');
      priceFilterBtn.classList.remove('active');
      isPriceFilterActive = false;
      currentPriceFilter = maxPrice;
      if (priceSlider) {
        priceSlider.value = maxPrice;
        updatePriceDisplay(maxPrice);
      }
      applyAllFilters();
    }
  }

  function applyAllFilters() {
    let visibleMeals = 0;
    
    allMeals.forEach(meal => {
      let shouldShow = true;
      
      const searchTerm = searchInput.value.toLowerCase().trim();
      if (searchTerm) {
        const title = meal.data.title.toLowerCase();
        shouldShow = shouldShow && (title.includes(searchTerm) || title.startsWith(searchTerm));
      }
      
      if (isPreferencesFilterActive && shouldShow) {
        const mealTags = meal.data.tags || [];
        const hasMatchingPreference = userPreferences.some(pref => 
          mealTags.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
        );
        shouldShow = shouldShow && hasMatchingPreference;
      }
      
      if (selectedCategories.size > 0 && shouldShow) {
        const mealCategory = meal.data.category;
        shouldShow = shouldShow && selectedCategories.has(mealCategory);
      }
      
      if (isPriceFilterActive && shouldShow) {
        const mealPrice = meal.data.currentRestaurant.prezzo || 0;
        shouldShow = shouldShow && mealPrice <= currentPriceFilter;
      }
      
      if (shouldShow) {
        meal.element.classList.remove('hidden');
        visibleMeals++;
      } else {
        meal.element.classList.add('hidden');
      }
      
      if (isPreferencesFilterActive) {
        const mealTags = meal.data.tags || [];
        const hasMatchingPreference = userPreferences.some(pref => 
          mealTags.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
        );
        if (hasMatchingPreference) {
          meal.element.classList.add('preferences-match');
        } else {
          meal.element.classList.remove('preferences-match');
        }
      } else {
        meal.element.classList.remove('preferences-match');
      }
    });
    
    if (visibleMeals === 0) {
      noPreferencesMessage.classList.remove('hidden');
      noPreferencesMessage.textContent = 'Nessun piatto trovato con le attuali preferenze. Prova a modificare le preferenze nella pagina Profilo';
    } else {
      noPreferencesMessage.classList.add('hidden');
    }
  }

  function filterByPreferences() {
    isPreferencesFilterActive = !isPreferencesFilterActive;
    
    if (isPreferencesFilterActive) {
      preferencesFilterBtn.classList.add('active');
    } else {
      preferencesFilterBtn.classList.remove('active');
    }
    
    applyAllFilters();
  }
  
  function showOrderConfirmation() {
    orderConfirmation.classList.add('show');
    
    setTimeout(() => {
      orderConfirmation.classList.remove('show');
      closeModal();
    }, 1000);
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
  function openModal(group){
    amTitle.textContent = group.title || 'Piatto';
    amImg.src = group.image || '';
    amCategory.textContent = group.category || '';
    amArea.textContent = group.area || '';
    amDesc.textContent = '';
         amInstructions.textContent = group.instructions || group.description || '';
     renderTags(amTags, group.tags);
     renderList(amIngredients, group.ingredients);
     renderList(amMeasures, group.measures);
     
    const price = (group.currentRestaurant && group.currentRestaurant.prezzo != null)
      ? Number(group.currentRestaurant.prezzo).toFixed(2) : '0.00';
    
    amOrder.className = 'btn-primary';
    amOrder.innerHTML = `Ordina €${price}`;
    
    if (group.source) { amSource.href = group.source; amSource.classList.remove('hidden'); } else { amSource.classList.add('hidden'); }
    if (group.youtube) { amYoutube.href = group.youtube; amYoutube.classList.remove('hidden'); } else { amYoutube.classList.add('hidden'); }
    
    amOrder._currentGroup = group;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    
    const modalPanel = modal.querySelector('.modal-panel');
    if (modalPanel) {
      modalPanel.scrollTop = 0;
    }
  }
  function closeModal(){
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
  }
  modal.addEventListener('click', (e)=>{
    if (e.target.matches('[data-close], .modal-backdrop')) closeModal();
  });

  amOrder?.addEventListener('click', async ()=>{
    try {
      const group = amOrder._currentGroup;
      if (!group || !group.currentRestaurant) {
        setStatus('Errore: dati piatto non validi');
        return;
      }

      const restaurant = group.currentRestaurant;
      const price = restaurant.prezzo || 0;

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          restaurantName: restaurant.restaurantName,
          mealId: group.mealId,
          qty: 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Errore aggiunta al carrello');
      }

        showOrderConfirmation();
       
    } catch (error) {
      console.error('Errore aggiunta al carrello:', error);
      setStatus(error.message || 'Errore aggiunta al carrello');
    }
  });

  async function checkUserType() {
    try {
      const res = await fetch('/api/profilo', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        const user = await res.json();
        if (user?.tipo === 'cliente') {
          cartBtn.style.display = 'inline-block';
          cartBtn.onclick = () => {
            window.location.href = '/cart';
          };
        } else {
          cartBtn.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Errore verifica tipo utente:', err);
      cartBtn.style.display = 'none';
    }
  }

  checkUserType();
  
  loadUserPreferences();


  const profileBtn = document.getElementById('profileBtn');
  const ordersBtn = document.getElementById('ordersBtn');
  const ordersHistoryBtn = document.getElementById('ordersHistoryBtn');
  const viewRestaurantsBtn = document.getElementById('viewRestaurantsBtn');

  profileBtn.addEventListener('click', () => {
    window.location.href = '/profile';
  });

  ordersBtn.addEventListener('click', () => {
    window.location.href = '/orders';
  });

  ordersHistoryBtn.addEventListener('click', () => {
    window.location.href = '/storico';
  });

  viewRestaurantsBtn.addEventListener('click', () => {
    window.location.href = '/restaurants';
  });

  searchInput.addEventListener('input', (e) => {
    filterMeals(e.target.value);
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      filterMeals(searchInput.value);
    }
  });

  preferencesFilterBtn.addEventListener('click', filterByPreferences);

  categoryFilterBtn.addEventListener('click', toggleCategoryDropdown);

  priceFilterBtn.addEventListener('click', togglePriceFilter);

  priceSlider.addEventListener('input', (e) => {
    const price = parseFloat(e.target.value);
    currentPriceFilter = price;
    updatePriceDisplay(price);
    applyAllFilters();
  });

  document.addEventListener('click', (e) => {
    if (!categoryFilterBtn.contains(e.target) && !categoryDropdown.contains(e.target)) {
      categoryDropdown.classList.add('hidden');
      categoryFilterBtn.classList.remove('active');
      isCategoryFilterActive = false;
    }
    
    if (!priceFilterBtn.contains(e.target) && !priceSliderContainer.contains(e.target)) {
      priceSliderContainer.classList.add('hidden');
      priceFilterBtn.classList.remove('active');
      isPriceFilterActive = false;
    }
  });

  function loadMealsData() {
    fetch('/api/available-meals', { credentials: 'include' })
      .then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(groups => {
        grid.innerHTML = '';
        const frag = document.createDocumentFragment();
        allMeals = [];
        
        groups.forEach(g => {
          g.restaurants.forEach(restaurant => {
            const img = g.image || '';
            const title = g.title || 'Piatto';
            const price = (restaurant.prezzo != null) ? `€${Number(restaurant.prezzo).toFixed(2)}` : '';
            
            const card = document.createElement('div');
            card.className = 'meal-card';
            card.innerHTML = `
              <img class=\"meal-thumb\" src=\"${img}\" alt=\"${title}\">
              <div class=\"meal-body\">
                <h3 class=\"meal-title\">${title}</h3>
                <div class=\"meal-price\">${price}</div>
                <div class=\"meal-desc\" style=\"grid-column:1/-1\">Disponibile presso: ${restaurant.restaurantName}</div>
              </div>
            `;
            
            const mealData = {
              ...g,
              currentRestaurant: restaurant,
              tags: g.tags || []
            };
            
            card.addEventListener('click', () => openModal(mealData));
            frag.appendChild(card);
            
            allMeals.push({
              element: card,
              data: mealData
            });
          });
        });
        grid.appendChild(frag);
        if (!groups.length) setStatus('Nessun piatto disponibile');
        
        loadAvailableCategoriesFromMeals();
        
        calculatePriceRange();
        
      })
      .catch(err => {
        console.error(err);
        setStatus('Errore caricamento piatti');
      });
  }

  loadMealsData();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadMealsData();
    }
  });
});