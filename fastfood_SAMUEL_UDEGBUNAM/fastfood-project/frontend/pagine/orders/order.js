document.addEventListener('DOMContentLoaded', function() {
    const restaurantsList = document.getElementById('restaurantsList');
    const backToMenu = document.getElementById('backToMenu');
    const profileBtn = document.getElementById('profileBtn');
    const cartBtn = document.getElementById('cartBtn');
    const ordersBtn = document.getElementById('ordersBtn');
    const status = document.getElementById('status');
    const confirmPickup = document.getElementById('confirmPickup');

    let currentOrderId = null;
    let statusCheckInterval = null;

    function euro(amount) {
        return `€${parseFloat(amount).toFixed(2)}`;
    }

    function getStatusNumber(status) {
        const statusMap = {
            'confirmed': 1,
            'preparing': 2,
            'ready': 3,
            'picked_up': 3,
            'completed': 3,
            'cancelled': 0
        };
        return statusMap[status] || 1;
    }

    function renderStatusNumbers(currentStatus) {
        const currentNumber = getStatusNumber(currentStatus);
        
        return `
            <div class="status-numbers">
                <div class="status-step">
                    <div class="status-number ${currentNumber >= 1 ? 'active' : ''} ${currentNumber === 1 ? 'current' : ''}">
                        1
                    </div>
                    <div class="status-label">Ordine ricevuto</div>
                </div>
                <div class="status-step">
                    <div class="status-number ${currentNumber >= 2 ? 'active' : ''} ${currentNumber === 2 ? 'current' : ''}">
                        2
                    </div>
                    <div class="status-label">In preparazione</div>
                </div>
                <div class="status-step">
                    <div class="status-number ${currentNumber >= 3 ? 'active' : ''} ${currentNumber === 3 ? 'current' : ''}">
                        3
                    </div>
                    <div class="status-label">Pronto al ritiro</div>
                </div>
            </div>
        `;
    }

    function groupItemsByRestaurant(items) {
        const restaurants = {};
        
        items.forEach(item => {
            if (!restaurants[item.restaurantName]) {
                restaurants[item.restaurantName] = {
                    name: item.restaurantName,
                    items: [],
                    total: 0
                };
            }
            
            restaurants[item.restaurantName].items.push(item);
            restaurants[item.restaurantName].total += item.price * item.qty;
        });
        
        return Object.values(restaurants);
    }

    function renderRestaurants(restaurants, orderStatus = 'confirmed') {
        if (!restaurants || restaurants.length === 0) {
            restaurantsList.innerHTML = '<p class="no-items">Nessun piatto ordinato</p>';
            return;
        }

        let containerClass;
        if (restaurants.length === 1) {
            containerClass = 'restaurants-grid-1';
        } else if (restaurants.length === 2) {
            containerClass = 'restaurants-grid-2';
        } else {
            containerClass = 'restaurants-grid-3';
        }
        
        const restaurantsHTML = restaurants.map(restaurant => {
            const itemsHTML = restaurant.items.map(item => `
                <div class="meal-card" data-meal-id="${item._id || item.idMeal}">
                    <div class="meal-img">
                        ${item.strMealThumb ? 
                            `<img src="${item.strMealThumb}" alt="${item.strMeal || item.title}" loading="lazy">` : 
                            '<div class="no-image"></div>'
                        }
                    </div>
                    <div class="meal-info">
                        <h3 class="meal-title">${item.strMeal || item.title}</h3>
                        <div class="meal-meta">
                            <span class="meal-quantity">Quantità: ${item.qty}</span>
                            <span class="meal-price">${euro(item.price * item.qty)}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            return `
                <div class="restaurant-section">
                    <h2 class="restaurant-title">${restaurant.name}</h2>
                    <div class="restaurant-meals">
                        ${itemsHTML}
                    </div>
                    <div class="restaurant-total">
                        <span>Totale: ${euro(restaurant.total)}</span>
                    </div>
                    ${renderStatusNumbers(orderStatus)}
                </div>
            `;
        }).join('');

        restaurantsList.innerHTML = `
            <div class="${containerClass}">
                ${restaurantsHTML}
            </div>
        `;
    }

    function getStatusText(status) {
        const statusMap = {
            'confirmed': 'Confermato',
            'preparing': 'In preparazione',
            'ready': 'Pronto per il ritiro',
            'picked_up': 'Ritirato',
            'completed': 'Completato',
            'cancelled': 'Annullato'
        };
        return statusMap[status] || 'Confermato';
    }

    function showOrderStatus(status) {
        if (status === 'confirmed') {
            status.innerHTML = `
                <div class="status-info" style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px; margin: 1rem 0;">
                    <span style="font-weight: 700; color: #28a745;">Ordine confermato con successo!</span>
                </div>
            `;
        } else {
            status.innerHTML = `
                <div class="status-info">
                    <span class="status-badge ${status}">${getStatusText(status)}</span>
                </div>
            `;
        }

        if (status === 'ready') {
            confirmPickup.style.display = 'block';
        } else {
            confirmPickup.style.display = 'none';
        }
    }

    async function checkOrderStatus() {
        if (!currentOrderId) return;

        try {
            const response = await fetch(`/api/orders/${currentOrderId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.order) {
                    const orderStatus = data.order.status;
                    
                    showOrderStatus(orderStatus);
                    
                    if (data.order.items && data.order.items.length > 0) {
                        const restaurants = groupItemsByRestaurant(data.order.items);
                        renderRestaurants(restaurants, orderStatus);
                    }
                    
                    if (orderStatus === 'completed' || orderStatus === 'picked_up') {
                        if (statusCheckInterval) {
                            clearInterval(statusCheckInterval);
                            statusCheckInterval = null;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Errore nel controllo dello status:', error);
        }
    }

    async function saveOrderToDatabase(items) {
        try {
            const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    items
                })
            });

            if (!orderResponse.ok) {
                throw new Error('Errore nel salvataggio dell\'ordine');
            }

            const orderResult = await orderResponse.json();
            console.log('Ordine salvato:', orderResult);
            
            if (orderResult.success && orderResult.order) {
                currentOrderId = orderResult.order._id;
                showOrderStatus(orderResult.order.status);
                
                if (statusCheckInterval) {
                    clearInterval(statusCheckInterval);
                }
                statusCheckInterval = setInterval(checkOrderStatus, 10000);
                
                return orderResult.order;
            }
        } catch (error) {
            console.error('Errore nel salvataggio dell\'ordine:', error);
        }
        return null;
    }

    async function loadOrderData() {
        try {
            const response = await fetch('/api/cart', { 
                credentials: 'include' 
            });
            
            if (response.ok) {
                const cartData = await response.json();
                
                if (cartData.items && cartData.items.length > 0) {
                    const restaurants = groupItemsByRestaurant(cartData.items);
                    
                    renderRestaurants(restaurants, 'confirmed');
                    
                    const savedOrder = await saveOrderToDatabase(cartData.items);
                    
                    await fetch('/api/cart', {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    
                    showOrderStatus('confirmed');
                    
                } else {
                    window.location.href = '/all-meals';
                }
            } else {
                console.error('Errore nel caricamento del carrello');
                window.location.href = '/all-meals';
            }
        } catch (error) {
            console.error('Errore:', error);
            window.location.href = '/all-meals';
        }
    }

    async function confirmOrderPickup() {
        if (!currentOrderId) {
            alert('Errore: ID ordine non trovato');
            return;
        }

        if (!confirm('Confermi di aver ritirato il tuo ordine?')) {
            return;
        }

        try {
            const response = await fetch(`/api/orders/${currentOrderId}/confirm-pickup`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    showOrderStatus('picked_up');
                    confirmPickup.style.display = 'none';
                    
                    if (statusCheckInterval) {
                        clearInterval(statusCheckInterval);
                        statusCheckInterval = null;
                    }
                    
                    alert('Ritiro confermato con successo!');
                } else {
                    alert(data.message || 'Errore nella conferma del ritiro');
                }
            } else {
                const data = await response.json();
                alert(data.message || 'Errore nella conferma del ritiro');
            }
        } catch (error) {
            console.error('Errore nella conferma del ritiro:', error);
            alert('Errore nella conferma del ritiro');
        }
    }

    backToMenu.addEventListener('click', () => {
        window.location.href = '/all-meals';
    });

    profileBtn.addEventListener('click', () => {
        window.location.href = '/profile';
    });

    cartBtn.addEventListener('click', () => {
        window.location.href = '/cart';
    });

    ordersBtn.addEventListener('click', () => {
        window.location.href = '/orders';
    });

    confirmPickup.addEventListener('click', confirmOrderPickup);

    loadOrderData();

    window.addEventListener('beforeunload', () => {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }
    });
});
