let loadActiveOrders;

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/orders/${orderId}/restaurant-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            const data = await response.json();
            if (loadActiveOrders) {
                loadActiveOrders();
            }
        } else if (response.status === 401) {
            console.log('Errore di sessione, ricarico la pagina...');
            location.reload();
        } else {
            const data = await response.json();
            console.error('Errore nell\'aggiornamento dello status:', data.message);
        }
    } catch (error) {
        console.error('Errore nell\'aggiornamento dello status:', error);
        alert('Errore nell\'aggiornamento dello status');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const activeOrdersList = document.getElementById('activeOrdersList');
    const viewHistory = document.getElementById('viewHistory');
    const viewMenu = document.getElementById('viewMenu');
    const addDishes = document.getElementById('addDishes');
    const backToProfile = document.getElementById('backToProfile');

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

        function renderStatusNumbers(currentStatus, orderId) {
            const currentNumber = getStatusNumber(currentStatus);
            
            return `
                <div class="status-numbers">
                    <div class="status-step">
                        <div class="status-number ${currentNumber >= 1 ? 'active' : ''} ${currentNumber === 1 ? 'current' : ''}" data-step="confirmed" data-order-id="${orderId}">
                        1
                    </div>
                        <div class="status-label">Ordine ricevuto</div>
                    </div>
                    <div class="status-step">
                        <div class="status-number ${currentNumber >= 2 ? 'active' : ''} ${currentNumber === 2 ? 'current' : ''}" data-step="preparing" data-order-id="${orderId}">
                        2
                    </div>
                        <div class="status-label">In preparazione</div>
                    </div>
                    <div class="status-step">
                        <div class="status-number ${currentNumber >= 3 ? 'active' : ''} ${currentNumber === 3 ? 'current' : ''}" data-step="ready" data-order-id="${orderId}">
                        3
                    </div>
                        <div class="status-label">Pronto al ritiro</div>
                    </div>
                </div>
            `;
        }

     function renderActiveOrders(orders) {
         const activeOrders = orders.filter(order => 
             order.status !== 'completed' && order.status !== 'cancelled'
         );

         if (!activeOrders || activeOrders.length === 0) {
             activeOrdersList.innerHTML = `
                 <div class="no-orders">
                     <h3>Nessun Ordine Attivo</h3>
                 </div>
             `;
             return;
         }

         const ordersByCustomer = {};
         
         activeOrders.forEach(order => {
             const customerName = order.customerName || 'Cliente';
             
             if (!ordersByCustomer[customerName]) {
                 ordersByCustomer[customerName] = [];
             }
             
             ordersByCustomer[customerName].push(order);
         });

         const customersHTML = Object.entries(ordersByCustomer).map(([customerName, customerOrders]) => {
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
                             <span class="item-price">€${(item.price * item.qty).toFixed(2)}</span>
                         </div>
                     </div>
                 `).join('');

                 return `
                     <div class="order-card" data-order-id="${order._id}">
                         <div class="order-items">
                             ${itemsHTML}
                         </div>
                         <div class="order-footer">
                             ${renderStatusNumbers(order.status, order._id)}
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

         activeOrdersList.innerHTML = customersHTML;
        
        document.querySelectorAll('.status-number').forEach(step => {
            step.addEventListener('click', async function() {
                const orderId = this.dataset.orderId;
                const newStatus = this.dataset.step;
                
                try {
                    const response = await fetch(`/api/orders/${orderId}/restaurant-status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ status: newStatus })
                    });
                    
                    if (response.ok) {
                        loadActiveOrders();
                    } else {
                        console.error('Errore nell\'aggiornamento dello stato');
                    }
                } catch (error) {
                    console.error('Errore nell\'aggiornamento dello stato:', error);
                }
            });
        });
    }

    loadActiveOrders = async function() {
        try {
            const response = await fetch('/api/orders/restaurant/active', { 
                credentials: 'include' 
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderActiveOrders(data.orders);
                } else {
                    throw new Error(data.message || 'Errore nel caricamento degli ordini');
                }
            } else if (response.status === 401) {
                console.log('Errore di sessione, ricarico la pagina...');
                location.reload();
                return;
            } else {
                throw new Error('Errore nella risposta del server');
            }
            
        } catch (error) {
            console.error('Errore nel caricamento degli ordini attivi:', error);
            activeOrdersList.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <h3>Errore nel caricamento</h3>
                    <p>Si è verificato un errore nel caricamento degli ordini attivi.</p>
                    <button onclick="location.reload()" class="btn-secondary">
                        Riprova
                    </button>
                </div>
            `;
        }
    }

    viewHistory.addEventListener('click', () => {
        window.location.href = '/restaurant-history';
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

    loadActiveOrders();

    setInterval(loadActiveOrders, 30000);
});