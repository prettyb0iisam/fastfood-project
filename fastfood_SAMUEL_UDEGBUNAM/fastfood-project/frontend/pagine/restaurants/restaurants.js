document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('restaurants');
  const statusEl = document.getElementById('status');
  const searchInput = document.getElementById('search-input');
  
  const profileBtn = document.getElementById('profileBtn');
  const ordersBtn = document.getElementById('ordersBtn');
  const historyBtn = document.getElementById('historyBtn');
  const menuBtn = document.getElementById('menuBtn');
  const cartBtn = document.getElementById('cartBtn');

  let allRestaurants = [];

  function setStatus(m){ if(statusEl){ statusEl.textContent=m||''; if(m) setTimeout(()=>statusEl.textContent='',2000); } }

  profileBtn.addEventListener('click', () => {
    window.location.href = '/profile';
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
      // Fallback
      window.location.href = '/storico';
    }
  });

  menuBtn.addEventListener('click', () => {
    window.location.href = '/all-meals';
  });

  cartBtn.addEventListener('click', () => {
    window.location.href = '/cart';
  });

  function filterRestaurants(searchTerm) {
    if (!searchTerm.trim()) {
      return allRestaurants;
    }
    
    const term = searchTerm.toLowerCase().trim();
    return allRestaurants.filter(restaurant => 
      restaurant.nomeRistorante && 
      restaurant.nomeRistorante.toLowerCase().includes(term)
    );
  }

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    const filteredRestaurants = filterRestaurants(searchTerm);
    renderRestaurants(filteredRestaurants);
  });

  function calculateWaitTime(activeOrders) {
    const minTime = activeOrders * 2;
    const maxTime = activeOrders * 2.5;
    
    let colorClass = 'green';
    if (maxTime > 20) {
      colorClass = 'red';
    } else if (maxTime >= 10) {
      colorClass = 'orange';
    } else if (maxTime > 5) {
      colorClass = 'yellow';
    }
    
    return {
      minTime,
      maxTime,
      colorClass,
      displayText: minTime === maxTime ? `${minTime} min` : `${minTime}-${maxTime} min`
    };
  }

  async function loadRestaurantStats(restaurantId) {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/stats`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const stats = await response.json();
        
        const completedEl = document.getElementById(`completed-${restaurantId}`);
        const activeEl = document.getElementById(`active-${restaurantId}`);
        const availableEl = document.getElementById(`available-${restaurantId}`);
        const avgPriceEl = document.getElementById(`avg-price-${restaurantId}`);
        const waitTimeEl = document.getElementById(`wait-time-${restaurantId}`);
        
        if (completedEl) completedEl.textContent = stats.completedOrders;
        if (activeEl) activeEl.textContent = stats.activeOrders;
        if (availableEl) availableEl.textContent = stats.availableMeals;
        if (avgPriceEl) avgPriceEl.textContent = `€${stats.averagePrice}`;
        
        if (waitTimeEl) {
          const waitTime = calculateWaitTime(stats.activeOrders);
          waitTimeEl.textContent = `Tempo di Attesa: ${waitTime.displayText}`;
          waitTimeEl.className = `wait-time ${waitTime.colorClass}`;
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche:', error);
    }
  }

  async function loadRestaurantsWithMeals() {
    try {
      const restaurantsResponse = await fetch('/api/open-restaurants', { 
        credentials: 'include' 
      });
      
      if (!restaurantsResponse.ok) {
        throw new Error('Errore nel caricamento dei ristoranti');
      }
      
      const restaurants = await restaurantsResponse.json();
      
      const mealsResponse = await fetch('/api/available-meals', { 
        credentials: 'include' 
      });
      
      if (!mealsResponse.ok) {
        throw new Error('Errore nel caricamento dei piatti');
      }
      
      const mealsData = await mealsResponse.json();
      
      const restaurantsWithMeals = new Set();
      
      mealsData.forEach(mealGroup => {
        mealGroup.restaurants.forEach(restaurant => {
          restaurantsWithMeals.add(restaurant.restaurantName);
        });
      });
      
      const availableRestaurants = restaurants.filter(restaurant => 
        restaurantsWithMeals.has(restaurant.nomeRistorante)
      );
      
      allRestaurants = availableRestaurants;
      
      renderRestaurants(availableRestaurants);
      
    } catch (error) {
      console.error('Errore nel caricamento:', error);
      setStatus('Errore caricamento ristoranti');
    }
  }

  function renderRestaurants(restaurants) {
    grid.innerHTML = '';
    
    if (!restaurants || restaurants.length === 0) {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        grid.innerHTML = `
          <div class="no-restaurants">
            <h3>Nessun Ristorante Trovato</h3>
            <p>Nessun ristorante trovato per "${searchTerm}".</p>
          </div>
        `;
      } else {
        grid.innerHTML = `
          <div class="no-restaurants">
            <h3>Nessun Ristorante Disponibile</h3>
            <p>Al momento non ci sono ristoranti con piatti disponibili.</p>
          </div>
        `;
      }
      return;
    }
    
    const frag = document.createDocumentFragment();
    
    restaurants.forEach(restaurant => {
      const title = restaurant.nomeRistorante || 'Ristorante';
      const phone = restaurant.numeroTelefono || '—';
      const address = restaurant.indirizzo || '—';
      const piva = restaurant.partitaIVA || '—';
      
      const card = document.createElement('div');
      card.className = 'restaurant-card';
      card.innerHTML = `
        <div class="restaurant-icon">
          <img src="https://cdn-icons-png.flaticon.com/512/6643/6643359.png" alt="Icona ristorante" onerror="this.style.display='none'">
        </div>
                 <div class="restaurant-body">
           <h3 class="restaurant-title">${title}</h3>
           <div class="restaurant-content">
             <div class="restaurant-info">
               <div class="restaurant-info-item">
                 <span class="restaurant-info-label">Telefono:</span>
                 <span class="restaurant-info-value">${phone}</span>
               </div>
               <div class="restaurant-info-item">
                 <span class="restaurant-info-label">Indirizzo:</span>
                 <span class="restaurant-info-value">${address}</span>
               </div>
               <div class="restaurant-info-item">
                 <span class="restaurant-info-label">P.IVA:</span>
                 <span class="restaurant-info-value">${piva}</span>
               </div>
               <div class="restaurant-info-item">
                 <span class="wait-time" id="wait-time-${restaurant._id}">Tempo di Attesa: —</span>
               </div>
             </div>
             <div class="restaurant-stats">
               <h4 class="stats-title">Statistiche</h4>
               <div class="stat-item">
                 <span class="stat-label">Piatti Disponibili:</span>
                 <span class="stat-value" id="available-${restaurant._id}">—</span>
               </div>
               <div class="stat-item">
                 <span class="stat-label">Ordini Attivi:</span>
                 <span class="stat-value" id="active-${restaurant._id}">—</span>
               </div>
               <div class="stat-item">
                 <span class="stat-label">Ordini Conclusi:</span>
                 <span class="stat-value" id="completed-${restaurant._id}">—</span>
               </div>
                               <div class="stat-item">
                  <span class="stat-label">Prezzo Medio a Piatto:</span>
                  <span class="stat-value" id="avg-price-${restaurant._id}">—</span>
                </div>
             </div>
           </div>
           <button class="view-menu-btn">Vedi Menu</button>
         </div>
      `;
      
      card.addEventListener('click', () => {
        window.location.href = `/public-menu?ristorante=${encodeURIComponent(title)}`;
      });
      
      frag.appendChild(card);
    });
    
    grid.appendChild(frag);
    
    restaurants.forEach(restaurant => {
      loadRestaurantStats(restaurant._id);
    });
  }

  loadRestaurantsWithMeals();
});