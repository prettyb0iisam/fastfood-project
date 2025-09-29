document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('cart-list');
  const statusEl = document.getElementById('status');
  const totalEl = document.getElementById('cart-total');
  const clearBtn = document.getElementById('cart-clear');
  const checkoutBtn = document.getElementById('cart-checkout');
  const backToMealsBtn = document.getElementById('backToMealsBtn');
  


  function setStatus(m){ if(statusEl){ statusEl.textContent=m||''; if(m) setTimeout(()=>statusEl.textContent='',2000); } }
  function euro(n){ return '€'+Number(n||0).toFixed(2); }

  function render(items, total){
    list.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'meal-card';
      card.dataset.mealId = it.mealId;
      card.dataset.idx = idx;
      card.innerHTML = `
        ${(it.strMealThumb || it.img) ? `<img class="meal-thumb" src="${it.strMealThumb || it.img}" alt="${it.strMeal || it.title}" loading="lazy">` : ''}
        <h3>
          <span class="meal-title">${it.strMeal || it.title}</span>
          <span class="meal-price">${euro(it.price)}</span>
        </h3>
        <div class="meal-desc">${it.restaurantName}</div>
        <div class="cart-controls">
          <div class="quantity-controls">
            <button class="btn-secondary btn-minus" data-idx="${idx}" title="Diminuisci quantità">−</button>
            <span class="quantity-display">${it.qty}</span>
            <button class="btn-secondary btn-plus" data-idx="${idx}" title="Aumenta quantità">+</button>
          </div>
          <button class="btn-danger btn-remove" data-idx="${idx}" title="Rimuovi dal carrello">Rimuovi</button>
        </div>
      `;
      frag.appendChild(card);
    });
    list.appendChild(frag);
    totalEl.textContent = 'Totale: ' + euro(total);
    checkoutBtn.disabled = items.length === 0;
  }

  async function load(){
    try {
      let r = await fetch('/api/cart', { credentials:'include' });
      if (!r.ok) throw new Error('HTTP '+r.status);
      let data = await r.json();
      
      if (!data.items || data.items.length === 0) {
        r = await fetch('/api/cart/migrate', { 
          method: 'POST',
          credentials:'include' 
        });
        if (r.ok) {
          data = await r.json();
          if (data.migrated > 0) {
            setStatus(`${data.migrated} articoli migrati dal carrello temporaneo`);
          }
        }
      }
      
      render(data.items || [], data.total || 0);
    } catch (err) {
      console.error('Errore caricamento carrello:', err);
      setStatus('Errore caricamento carrello');
    }
  }

  async function patchQty(idx, qty){
    const r = await fetch('/api/cart/'+idx, {
      method: 'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ qty })
    });
    if (!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }
  async function removeIdx(idx){
    const r = await fetch('/api/cart/'+idx, { method:'DELETE', credentials:'include' });
    if (!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }
  async function clear(){
    const r = await fetch('/api/cart', { method:'DELETE', credentials:'include' });
    if (!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }

  list.addEventListener('click', async (e) => {
    const minus = e.target.closest('.btn-minus');
    const plus  = e.target.closest('.btn-plus');
    const rm    = e.target.closest('.btn-remove');
    
    if (!minus && !plus && !rm) return;
    const idx = parseInt((minus||plus||rm).dataset.idx, 10);
    try {
      if (minus || plus) {
        const currentItem = list.children[idx];
        const qtyDisplay = currentItem.querySelector('.quantity-display');
        let currentQty = parseInt(qtyDisplay.textContent, 10) || 1;
        
        const newQty = minus ? Math.max(1, currentQty - 1) : currentQty + 1;
        
        const data = await patchQty(idx, newQty);
        render(data.items || [], data.total || 0);
      } else if (rm) {
        const data = await removeIdx(idx);
        render(data.items || [], data.total || 0);
      }
    } catch (err) { setStatus('Errore aggiornamento carrello'); }
  });

  clearBtn.addEventListener('click', async () => {
    try { const data = await clear(); render(data.items || [], data.total || 0); }
    catch(err){ setStatus('Errore svuotamento carrello'); }
  });

  checkoutBtn.addEventListener('click', async () => {
    const items = document.querySelectorAll('#cart-list .meal-card');
    if (items.length === 0) {
      alert('Il carrello è vuoto!');
      return;
    }
    
    try {
      await confirmOrder();
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine:', error);
      setStatus('Errore nella creazione dell\'ordine');
    }
  });

  backToMealsBtn.addEventListener('click', () => {
    window.location.href = '/all-meals';
  });

  document.getElementById('profileBtn').addEventListener('click', () => {
    window.location.href = '/profile';
  });

  document.getElementById('ordersBtn').addEventListener('click', () => {
    window.location.href = '/orders';
  });

  document.getElementById('historyBtn').addEventListener('click', async () => {
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

  document.getElementById('restaurantsBtn').addEventListener('click', () => {
    window.location.href = '/restaurants';
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s =>
      ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[s])
    );
  }

  async function confirmOrder() {
    try {
      const cartResponse = await fetch('/api/cart', {
        credentials: 'include'
      });
      
      if (!cartResponse.ok) {
        throw new Error('Errore nel recupero del carrello');
      }
      
      const cartData = await cartResponse.json();
      
      if (!cartData.items || cartData.items.length === 0) {
        throw new Error('Il carrello è vuoto');
      }
      
      const itemsByRestaurant = {};
      cartData.items.forEach(item => {
        const restaurantName = item.restaurantName || 'Ristorante';
        if (!itemsByRestaurant[restaurantName]) {
          itemsByRestaurant[restaurantName] = [];
        }
        itemsByRestaurant[restaurantName].push(item);
      });
      
      const orderPromises = Object.entries(itemsByRestaurant).map(async ([restaurantName, items]) => {
        const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        const orderData = {
          orderNumber: orderNumber,
          items: items.map(item => ({
            restaurantName: item.restaurantName,
            itemId: item.itemId || item._id,
            mealId: item.mealId,
            title: item.strMeal || item.title,
            price: item.price,
            img: item.img || '',
            strMealThumb: item.strMealThumb || '',
            strMeal: item.strMeal || item.title,
            qty: item.qty
          })),
          totalAmount: totalAmount
        };
        
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(orderData)
        });

        if (!response.ok) {
          throw new Error(`Errore nella creazione dell'ordine per ${restaurantName}`);
        }

        return response.json();
      });
      
      const results = await Promise.all(orderPromises);
      
      const allSuccessful = results.every(result => result.success);
      
             if (allSuccessful) {
         await fetch('/api/cart', {
           method: 'DELETE',
           credentials: 'include'
         });
         
         window.location.href = '/orders';
       } else {
        throw new Error('Errore nella creazione di uno o più ordini');
      }
    } catch (error) {
      console.error('Errore nella creazione dell\'ordine:', error);
      setStatus('Errore nella creazione dell\'ordine');
    }
  }

  load().catch(err => setStatus('Errore caricamento carrello'));
});