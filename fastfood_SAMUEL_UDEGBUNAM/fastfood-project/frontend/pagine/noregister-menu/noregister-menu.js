
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
  const registerBtn = document.getElementById('registerBtn');
  
  const noPreferencesMessage = document.getElementById('no-preferences-message');
  
  let allMeals = [];
  let availableMeals = new Set();

  function setStatus(m){ if(statusEl){ statusEl.textContent=m||''; if(m) setTimeout(()=>statusEl.textContent='',2000); } }
  

  
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
      list = tags;
    } else if (typeof tags === 'string') {
      list = tags.split(/[,\s]+/).filter(t => t.trim());
    } else {
      list = [];
    }
    
    const filteredList = list.map(t => t.trim()).filter(Boolean);
    
    filteredList.forEach((t, index) => {
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
    
    amOrder.className = 'btn-primary';
    amOrder.innerHTML = 'Registrati per Ordinare';
    
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

  amOrder?.addEventListener('click', () => {
    window.location.href = '/register';
  });

  registerBtn.addEventListener('click', () => {
    window.location.href = '/register';
  });



  function normalizeMealData(meal) {
    let processedTags = [];
    
    if (Array.isArray(meal.strTags)) {
      meal.strTags.forEach(tagItem => {
        if (typeof tagItem === 'string' && tagItem.includes(',')) {
          const splitTags = tagItem.split(/[,\s]+/).filter(t => t.trim());
          processedTags.push(...splitTags);
        } else if (tagItem && tagItem.trim()) {
          processedTags.push(tagItem.trim());
        }
      });
    } else if (meal.strTags) {
      processedTags = meal.strTags.split(/[,\s]+/).filter(t => t.trim());
    }
    
    return {
      title: meal.strMeal || meal.nome || 'Piatto',
      image: meal.strMealThumb || meal.foto || '',
      category: meal.strCategory || meal.tipologia || '',
      area: meal.strArea || '',
      description: meal.strInstructions || '',
      instructions: meal.strInstructions || '',
      tags: processedTags,
      ingredients: meal.ingredients || meal.ingredienti || [],
      measures: meal.measures || [],
      youtube: meal.strYoutube || '',
      source: meal.strSource || '',
      mealId: meal.idMeal || meal._id
    };
  }

  async function loadMeals() {
    try {
      
      try {
        const availableResponse = await fetch('/api/available-meals', { 
          credentials: 'include' 
        });
                 if (availableResponse.ok) {
           const availableGroups = await availableResponse.json();
           
           availableGroups.forEach(g => {
             if (g.mealId) {
               availableMeals.add(g.mealId);
             }
             else if (g._id) {
               availableMeals.add(g._id);
             }
           });
         }
              } catch (error) {
        }
      
      const mealsResponse = await fetch('/api/meals', { 
        credentials: 'include' 
      });
      
      if (!mealsResponse.ok) {
        throw new Error(`HTTP ${mealsResponse.status}: ${mealsResponse.statusText}`);
      }
      
             const allGroups = await mealsResponse.json();
      
      if (!Array.isArray(allGroups)) {
        throw new Error('Invalid response format: expected array');
      }
      
      renderMeals(allGroups);
      
    } catch (error) {
      console.error('Error loading meals:', error);
      
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
          <h3>Errore nel caricamento dei piatti</h3>
          <p>Impossibile caricare i piatti dal database. Riprova più tardi.</p>
          <p style="font-size: 0.9rem; color: #999;">Errore: ${error.message}</p>
        </div>
      `;
    }
  }

  function renderMeals(meals) {
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    allMeals = [];
    
         meals.forEach(g => {
       const normalizedData = normalizeMealData(g);
       const img = normalizedData.image || '';
       const title = normalizedData.title || 'Piatto';
       const mongoId = g._id;
       const isAvailable = availableMeals.has(mongoId);
      
      const card = document.createElement('div');
      card.className = 'meal-card';
      
      if (isAvailable) {
        card.classList.add('available');
      }
      
      const availabilityBadge = isAvailable ? '<div class="availability-badge">DISPONIBILE</div>' : '';
      
      card.innerHTML = `
        <div class="meal-card-wrapper">
          <img class="meal-thumb" src="${img}" alt="${title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltbWFnaW5lIG5vbiBkaXNwb25pYmlsZTwvdGV4dD48L3N2Zz4='">
          <div class="meal-body">
            <div class="meal-title-row">
              <h3 class="meal-title">${title}</h3>
              ${availabilityBadge}
            </div>
          </div>
        </div>
      `;
      
      card.addEventListener('click', () => openModal(normalizedData));
      frag.appendChild(card);
      
      allMeals.push({
        element: card,
        data: normalizedData
      });
    });
    
         grid.appendChild(frag);
     
     document.title = `Tutti i Piatti`;
    
  }

  loadMeals();
});
