document.addEventListener('DOMContentLoaded', function() {
    const completedOrdersList = document.getElementById('completedOrdersList');
    const viewActiveOrders = document.getElementById('viewActiveOrders');
    const viewMenu = document.getElementById('viewMenu');
    const addDishes = document.getElementById('addDishes');
    const backToProfile = document.getElementById('backToProfile');

    function euro(amount) {
        return `€${parseFloat(amount).toFixed(2)}`;
    }

    function renderCompletedOrders(orders) {
        if (!orders || orders.length === 0) {
            completedOrdersList.innerHTML = `
                <div class="loading">Nessun Ordine Completato</div>
            `;
            return;
        }

        const ordersByCustomer = {};
        orders.forEach(order => {
            const customerName = order.customerName || 'Cliente';
            if (!ordersByCustomer[customerName]) {
                ordersByCustomer[customerName] = [];
            }
            ordersByCustomer[customerName].push(order);
        });

        const ordersHTML = Object.entries(ordersByCustomer).map(([customerName, customerOrders]) => {
            const customerOrdersHTML = customerOrders.map(order => {
                const itemsHTML = order.items.map(item => `
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
                `).join('');

                return `
                    <div class="order-card">
                        <div class="order-items">
                            ${itemsHTML}
                        </div>
                        <div class="order-footer">
                            <div class="pickup-completed">Ritiro Effettuato</div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="customer-section">
                    <h3 class="customer-title">${customerName}</h3>
                    <div class="customer-orders">
                        ${customerOrdersHTML}
                    </div>
                </div>
            `;
        }).join('');

        completedOrdersList.innerHTML = ordersHTML;
    }

    async function loadCompletedOrders() {
        try {
            const response = await fetch('/api/orders/restaurant/completed', { 
                credentials: 'include' 
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderCompletedOrders(data.orders);
                } else {
                    throw new Error(data.message || 'Errore nel caricamento dello storico');
                }
            } else {
                throw new Error('Errore nella risposta del server');
            }
            
        } catch (error) {
            console.error('Errore nel caricamento dello storico:', error);
            completedOrdersList.innerHTML = `
                <div class="loading">Errore nel caricamento</div>
            `;
        }
    }

    viewActiveOrders.addEventListener('click', () => {
        window.location.href = '/restaurant-orders';
    });

    viewMenu.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/profilo', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                if (userData.nomeRistorante) {
                    const ristorante = userData.nomeRistorante.trim();
                    window.location.href = `/mymenu?ristorante=${encodeURIComponent(ristorante)}`;
                } else {
                    window.location.href = '/mymenu';
                }
            } else if (response.status === 401) {
                console.log('Errore di sessione, ricarico la pagina...');
                location.reload();
            } else {
                window.location.href = '/mymenu';
            }
        } catch (error) {
            console.error('Errore nel caricamento del profilo:', error);
            window.location.href = '/mymenu';
        }
    });

    addDishes.addEventListener('click', () => {
        window.location.href = '/menu';
    });

    backToProfile.addEventListener('click', () => {
        window.location.href = '/profile';
    });

    loadCompletedOrders();
});