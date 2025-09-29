document.addEventListener('DOMContentLoaded', function() {
    const ordersList = document.getElementById('ordersList');
    const restaurantsBtn = document.getElementById('restaurantsBtn');
    const ordersBtn = document.getElementById('ordersBtn');
    const profileBtn = document.getElementById('profileBtn');
    const menuBtn = document.getElementById('menuBtn');
    const cartBtn = document.getElementById('cartBtn');

    function euro(amount) {
        return `€${parseFloat(amount).toFixed(2)}`;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function renderOrders(orders) {
        if (!orders || orders.length === 0) {
            ordersList.innerHTML = `
                <div class="no-orders">
                    <h3>Nessun Ordine Completato</h3>
                </div>
            `;
            return;
        }

        const ordersByRestaurant = {};
        
        orders.forEach(order => {
            const restaurantName = order.items[0]?.restaurantName || 'Ristorante';
            
            if (!ordersByRestaurant[restaurantName]) {
                ordersByRestaurant[restaurantName] = {};
            }
            
            const orderId = order._id;
            if (!ordersByRestaurant[restaurantName][orderId]) {
                ordersByRestaurant[restaurantName][orderId] = {
                    orderId: orderId,
                    status: order.status,
                    createdAt: order.createdAt,
                    items: []
                };
            }
            
            order.items.forEach(item => {
                ordersByRestaurant[restaurantName][orderId].items.push(item);
            });
        });

        const restaurantsHTML = Object.entries(ordersByRestaurant).map(([restaurantName, restaurantOrders]) => {
            const restaurantOrdersHTML = Object.values(restaurantOrders).map(orderData => {
                const itemsHTML = orderData.items.map(item => {
                    return `
                        <div class="order-item">
                            <div class="item-image">
                                ${(item.strMealThumb || item.img) ? 
                                    `<img src="${item.strMealThumb || item.img}" alt="${item.strMeal || item.title}" loading="lazy">` : 
                                    '<div class="no-image">-</div>'
                                }
                            </div>
                            <div class="item-details">
                                <h4 class="item-title">${item.strMeal || item.title}</h4>
                                <span class="item-quantity">Quantità: ${item.qty}</span>
                                <span class="item-price">${euro(item.price)}</span>
                            </div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="order-card">
                        <div class="order-items">
                            ${itemsHTML}
                        </div>
                        <div class="order-footer">
                            <div class="order-completed">
                                <span class="order-completed-text">Ordine Completato</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="restaurant-section">
                    <h3 class="restaurant-title">${restaurantName}</h3>
                    <div class="restaurant-orders">
                        ${restaurantOrdersHTML}
                    </div>
                </div>
            `;
        }).join('');

        ordersList.innerHTML = restaurantsHTML;
    }

    async function loadCompletedOrders() {
        try {
            const response = await fetch('/api/orders/completed', { 
                credentials: 'include' 
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderOrders(data.orders);
                } else {
                    throw new Error(data.message || 'Errore nel caricamento degli ordini completati');
                }
            } else if (response.status === 401) {
                console.log('Errore di sessione, ricarico la pagina...');
                location.reload();
                return;
            } else {
                throw new Error('Errore nella risposta del server');
            }
            
        } catch (error) {
            console.error('Errore nel caricamento degli ordini completati:', error);
            ordersList.innerHTML = `
                <div class="error-message">
                    <h3>Errore nel caricamento</h3>
                    <p>Si è verificato un errore nel caricamento dello storico ordini.</p>
                    <button onclick="location.reload()" class="btn-secondary">
                        Riprova
                    </button>
                </div>
            `;
        }
    }

    restaurantsBtn.addEventListener('click', () => {
        window.location.href = '/restaurants';
    });

    ordersBtn.addEventListener('click', () => {
        window.location.href = '/orders';
    });

    profileBtn.addEventListener('click', () => {
        window.location.href = '/profile';
    });

    menuBtn.addEventListener('click', () => {
        window.location.href = '/all-meals';
    });

    cartBtn.addEventListener('click', () => {
        window.location.href = '/cart';
    });

    loadCompletedOrders();
});
