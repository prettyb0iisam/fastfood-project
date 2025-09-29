document.addEventListener('DOMContentLoaded', function() {
    const ordersList = document.getElementById('ordersList');
    const restaurantsBtn = document.getElementById('restaurantsBtn');
    const historyBtn = document.getElementById('historyBtn');
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
            ${currentStatus === 'ready' ? `
                <button class="btn-primary confirm-pickup-btn" onclick="confirmPickup('${orderId}')">
                    Ordine Ritirato
                </button>
            ` : ''}
        `;
    }

    function renderOrders(orders) {
        if (!orders || orders.length === 0) {
            ordersList.innerHTML = `
                <div class="no-orders">
                    <h3>Nessun Ordine Attivo</h3>
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
                            ${renderStatusNumbers(orderData.status, orderData.orderId)}
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

    async function loadOrders() {
        try {
            const response = await fetch('/api/orders', { 
                credentials: 'include' 
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderOrders(data.orders);
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
            console.error('Errore nel caricamento degli ordini:', error);
            ordersList.innerHTML = `
                <div class="error-message">
                    <h3>Errore nel caricamento</h3>
                    <p>Si è verificato un errore nel caricamento degli ordini.</p>
                    <button onclick="location.reload()" class="btn-secondary">
                        Riprova
                    </button>
                </div>
            `;
        }
    }

    function getNextStatus(currentStatus) {
        const statusFlow = {
            'confirmed': 'preparing',
            'preparing': 'ready',
            'ready': 'picked_up',
            'picked_up': 'completed',
            'completed': 'completed'
        };
        return statusFlow[currentStatus] || 'confirmed';
    }

    async function updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                loadOrders();
            } else if (response.status === 401) {
                console.log('Errore di sessione, ricarico la pagina...');
                location.reload();
            } else {
                const data = await response.json();
                alert(data.message || 'Errore nell\'aggiornamento dello status');
            }
        } catch (error) {
            console.error('Errore nell\'aggiornamento dello status:', error);
            alert('Errore nell\'aggiornamento dello status');
        }
    }

    window.confirmPickup = async function(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}/confirm-pickup`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                showFeedbackPopup();
            } else if (response.status === 401) {
                console.log('Errore di sessione, ricarico la pagina...');
                location.reload();
            } else {
                const data = await response.json();
                alert(data.message || 'Errore nella conferma del ritiro');
            }
        } catch (error) {
            console.error('Errore nella conferma del ritiro:', error);
            alert('Errore nella conferma del ritiro');
        }
    };

    function showFeedbackPopup() {
        const popup = document.createElement('div');
        popup.className = 'feedback-popup';
        popup.innerHTML = `
            <div class="feedback-popup-content">
                <div class="feedback-message">Grazie per il Feedback!</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(popup);
                window.location.href = '/storico';
            }, 300);
        }, 2000);
    }

    async function deleteOrder(orderId) {
        if (!confirm('Sei sicuro di voler eliminare questo ordine?')) {
            return;
        }

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                loadOrders();
            } else {
                const data = await response.json();
                alert(data.message || 'Errore nell\'eliminazione dell\'ordine');
            }
        } catch (error) {
            console.error('Errore nell\'eliminazione dell\'ordine:', error);
            alert('Errore nell\'eliminazione dell\'ordine');
        }
    }

    restaurantsBtn.addEventListener('click', () => {
        window.location.href = '/restaurants';
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

    profileBtn.addEventListener('click', () => {
        window.location.href = '/profile';
    });

    menuBtn.addEventListener('click', () => {
        window.location.href = '/all-meals';
    });

    cartBtn.addEventListener('click', () => {
        window.location.href = '/cart';
    });

    loadOrders();
});
