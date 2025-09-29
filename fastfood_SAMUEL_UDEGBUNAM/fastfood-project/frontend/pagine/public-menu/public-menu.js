document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('menu-container');
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
  
  const restaurantsBtn = document.getElementById('restaurantsBtn');
  const ordersBtn = document.getElementById('ordersBtn');
  const historyBtn = document.getElementById('historyBtn');
  const menuBtn = document.getElementById('menuBtn');
  const profileBtn = document.getElementById('profileBtn');
  
  let currentRestaurant = '';

  function setStatus(m){ if(statusEl){ statusEl.textContent=m||''; if(m) setTimeout(()=>statusEl.textContent='',2000); } }
  
  function showOrderConfirmation() {
    orderConfirmation.classList.remove('hidden');
    orderConfirmation.classList.add('show');
    
    setTimeout(() => {
      orderConfirmation.classList.remove('show');
      orderConfirmation.classList.add('hidden');
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
    
    let tagList = [];
    
    if (Array.isArray(tags)) {
      tagList = tags;
    } else if (typeof tags === 'string') {
      tagList = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
    
    tagList.forEach((tag, index) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag.trim();
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
     
    const price = (group.prezzo != null) ? Number(group.prezzo).toFixed(2) : '0.00';
    
    amOrder.className = 'btn-primary';
    amOrder.innerHTML = `Ordina €${price}`;
    
    if (group.source) { amSource.href = group.source; amSource.classList.remove('hidden'); } else { amSource.classList.add('hidden'); }
    if (group.youtube) { amYoutube.href = group.youtube; amYoutube.classList.remove('hidden'); } else { amYoutube.classList.add('hidden'); }
    
    amOrder._currentGroup = group;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    
    const modalScroll = modal.querySelector('.modal-scroll');
    if (modalScroll) {
      modalScroll.scrollTop = 0;
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
      if (!group) {
        setStatus('Errore: dati piatto non validi');
        return;
      }

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          restaurantName: currentRestaurant,
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

  restaurantsBtn.addEventListener('click', () => {
    window.location.href = '/restaurants';
  });

  ordersBtn.addEventListener('click', () => {
    window.location.href = '/orders';
  });

  historyBtn.addEventListener('click', async () => {
    try {
      const profileResponse = await fetch('/api/profilo', {
        credentials: 'include'
      });
      
      if (profileResponse.ok) {
        const userData = await profileResponse.json();
        const isRestaurateur = userData.tipo === 'ristoratore';
        
        if (isRestaurateur) {
          window.location.href = '/restaurant-history';
        } else {
          window.location.href = '/storico';
        }
      } else {
        window.location.href = '/storico';
      }
    } catch (error) {
      console.error('Errore nel recupero del profilo:', error);
      window.location.href = '/storico';
    }
  });

  menuBtn.addEventListener('click', () => {
    window.location.href = '/all-meals';
  });

  profileBtn.addEventListener('click', () => {
    window.location.href = '/profile';
  });

  async function loadRestaurantMenu() {
    const params = new URLSearchParams(window.location.search);
    const restaurantName = params.get('ristorante');
    
    if (!restaurantName) {
      setStatus('Nome ristorante non specificato');
      return;
    }

    currentRestaurant = restaurantName;
    document.getElementById('restaurant-title').textContent = `Menu di ${restaurantName}`;

    try {
      const response = await fetch(`/api/menu/${encodeURIComponent(restaurantName)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento del menu');
      }

      const menuItems = await response.json();
      
      if (!menuItems || menuItems.length === 0) {
        grid.innerHTML = `
          <div class="no-menu">
            <h3>Nessun Piatto Disponibile</h3>
            <p>Al momento questo ristorante non ha piatti nel menu.</p>
          </div>
        `;
        return;
      }

      renderMenu(menuItems);

    } catch (error) {
      console.error('Errore nel caricamento del menu:', error);
      setStatus('Errore nel caricamento del menu');
    }
  }

  function renderMenu(menuItems) {
    grid.innerHTML = '';
    
    const frag = document.createDocumentFragment();
    
    menuItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'meal-card';
      
      const price = item.prezzo || 0;
      const image = item.meal?.foto || item.meal?.strMealThumb || '/img/placeholder.jpg';
      const title = item.nome || item.meal?.strMeal || 'Piatto';
      
      card.innerHTML = `
        <img class="meal-thumb" src="${image}" alt="${title}" loading="lazy">
        <div class="meal-body">
          <h3 class="meal-title">${title}</h3>
          <div class="meal-price">€${price.toFixed(2)}</div>
        </div>
      `;
      
       card.addEventListener('click', () => {
        const mealData = {
          mealId: item.meal?._id || item._id,
          title: title,
          image: image,
          prezzo: price,
          category: item.strCategory || item.meal?.strCategory || '',
          area: item.strArea || item.meal?.strArea || '',
          description: item.hasOwnProperty('strInstructions') ? item.strInstructions : (item.meal?.strInstructions || ''),
          instructions: item.hasOwnProperty('strInstructions') ? item.strInstructions : (item.meal?.strInstructions || ''),
                                                                 tags: (() => {
               const processTags = (tagData) => {
                 if (!tagData) return [];
                 
                 if (Array.isArray(tagData)) {
                   if (tagData.length === 1 && typeof tagData[0] === 'string' && tagData[0].includes(',')) {
                     return tagData[0].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                   }
                   return tagData.filter(tag => tag && tag.trim());
                 }
                 
                 if (typeof tagData === 'string' && tagData.trim()) {
                   return tagData.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                 }
                 
                 return [];
               };
               
               const menuTags = processTags(item.strTags);
               if (menuTags.length > 0) {
                 return menuTags;
               }
               
               const mealTags = processTags(item.meal?.strTags);
               if (mealTags.length > 0) {
                 return mealTags;
               }
               
               return [];
             })(),
          ingredients: (() => {
            if (Array.isArray(item.ingredients)) return item.ingredients;
            if (Array.isArray(item.meal?.ingredients)) return item.meal.ingredients;
            
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
              const ingredient = item.meal?.[`strIngredient${i}`] || item[`strIngredient${i}`];
              if (ingredient && ingredient.trim()) {
                ingredients.push(ingredient.trim());
              }
            }
            return ingredients;
          })(),
          measures: (() => {
            if (Array.isArray(item.measures)) return item.measures;
            if (Array.isArray(item.meal?.measures)) return item.meal.measures;
            
            const measures = [];
            for (let i = 1; i <= 20; i++) {
              const measure = item.meal?.[`strMeasure${i}`] || item[`strMeasure${i}`];
              if (measure && measure.trim()) {
                measures.push(measure.trim());
              }
            }
            return measures;
          })(),
          youtube: item.hasOwnProperty('youtube') ? item.youtube : (item.meal?.strYoutube || ''),
          source: item.hasOwnProperty('source') ? item.source : (item.meal?.strSource || '')
                 };
         
         openModal(mealData);
      });
      
      frag.appendChild(card);
    });
    
    grid.appendChild(frag);
  }

  loadRestaurantMenu();
});