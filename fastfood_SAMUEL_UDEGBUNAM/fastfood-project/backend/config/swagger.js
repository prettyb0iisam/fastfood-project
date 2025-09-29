const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FastFood API',
      version: '1.0.0',
      description: 'API completa per il sistema di gestione fast food con funzionalità per clienti e ristoratori',
      contact: {
        name: 'FastFood Team',
        email: 'support@fastfood.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Server di sviluppo'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'fastfood-session',
          description: 'Autenticazione tramite sessione Express'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['nome', 'email', 'password', 'tipo'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID univoco dell\'utente'
            },
            nome: {
              type: 'string',
              description: 'Nome dell\'utente'
            },
            cognome: {
              type: 'string',
              description: 'Cognome dell\'utente (obbligatorio per clienti)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email dell\'utente'
            },
            password: {
              type: 'string',
              description: 'Password dell\'utente'
            },
            tipo: {
              type: 'string',
              enum: ['cliente', 'ristoratore'],
              description: 'Tipo di utente'
            },
            metodoPagamento: {
              type: 'string',
              description: 'Metodo di pagamento preferito (solo per clienti)'
            },
            preferenze: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Preferenze alimentari (solo per clienti)'
            },
            nomeRistorante: {
              type: 'string',
              description: 'Nome del ristorante (solo per ristoratori)'
            },
            numeroTelefono: {
              type: 'string',
              description: 'Numero di telefono del ristorante (solo per ristoratori)'
            },
            partitaIVA: {
              type: 'string',
              description: 'Partita IVA del ristorante (solo per ristoratori)'
            },
            indirizzoRistorante: {
              type: 'string',
              description: 'Indirizzo del ristorante (solo per ristoratori)'
            }
          }
        },
        Meal: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID univoco del piatto'
            },
            nome: {
              type: 'string',
              description: 'Nome del piatto'
            },
            prezzo: {
              type: 'number',
              description: 'Prezzo del piatto'
            },
            foto: {
              type: 'string',
              description: 'URL dell\'immagine del piatto'
            },
            strCategory: {
              type: 'string',
              description: 'Categoria del piatto'
            },
            strArea: {
              type: 'string',
              description: 'Area di provenienza del piatto'
            },
            strInstructions: {
              type: 'string',
              description: 'Istruzioni per la preparazione'
            },
            strTags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Tag associati al piatto'
            },
            ingredients: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Lista degli ingredienti'
            },
            measures: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Misurazioni degli ingredienti'
            },
            youtube: {
              type: 'string',
              description: 'URL video YouTube'
            },
            source: {
              type: 'string',
              description: 'Fonte della ricetta'
            },
            creatoDa: {
              type: 'string',
              description: 'ID dell\'utente che ha creato il piatto'
            },
            isComune: {
              type: 'boolean',
              description: 'Se il piatto è comune o personalizzato'
            }
          }
        },
        Restaurant: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID univoco del ristorante'
            },
            nomeRistorante: {
              type: 'string',
              description: 'Nome del ristorante'
            },
            numeroTelefono: {
              type: 'string',
              description: 'Numero di telefono'
            },
            partitaIVA: {
              type: 'string',
              description: 'Partita IVA'
            },
            indirizzo: {
              type: 'string',
              description: 'Indirizzo del ristorante'
            },
            owners: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array di ID dei proprietari'
            },
            menu: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MenuItem'
              },
              description: 'Menu del ristorante'
            }
          }
        },
        MenuItem: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID univoco dell\'item del menu'
            },
            meal: {
              $ref: '#/components/schemas/Meal'
            },
            nome: {
              type: 'string',
              description: 'Nome personalizzato dell\'item'
            },
            prezzo: {
              type: 'number',
              description: 'Prezzo personalizzato'
            },
            attivo: {
              type: 'boolean',
              description: 'Se l\'item è attivo nel menu'
            },
            strCategory: {
              type: 'string',
              description: 'Categoria personalizzata'
            },
            strArea: {
              type: 'string',
              description: 'Area personalizzata'
            },
            strInstructions: {
              type: 'string',
              description: 'Istruzioni personalizzate'
            },
            strTags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Tag personalizzati'
            },
            ingredients: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Ingredienti personalizzati'
            },
            measures: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Misurazioni personalizzate'
            },
            youtube: {
              type: 'string',
              description: 'URL YouTube personalizzato'
            },
            source: {
              type: 'string',
              description: 'Fonte personalizzata'
            }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID univoco del carrello'
            },
            userId: {
              type: 'string',
              description: 'ID dell\'utente proprietario'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem'
              },
              description: 'Items nel carrello'
            }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            restaurantName: {
              type: 'string',
              description: 'Nome del ristorante'
            },
            itemId: {
              type: 'string',
              description: 'ID dell\'item nel menu'
            },
            mealId: {
              type: 'string',
              description: 'ID del piatto'
            },
            title: {
              type: 'string',
              description: 'Nome del piatto'
            },
            price: {
              type: 'number',
              description: 'Prezzo unitario'
            },
            img: {
              type: 'string',
              description: 'URL dell\'immagine'
            },
            strMealThumb: {
              type: 'string',
              description: 'URL thumbnail'
            },
            strMeal: {
              type: 'string',
              description: 'Nome del piatto originale'
            },
            qty: {
              type: 'number',
              description: 'Quantità'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID univoco dell\'ordine'
            },
            userId: {
              type: 'string',
              description: 'ID dell\'utente che ha effettuato l\'ordine'
            },
            orderNumber: {
              type: 'string',
              description: 'Numero dell\'ordine'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem'
              },
              description: 'Items ordinati'
            },
            totalAmount: {
              type: 'number',
              description: 'Importo totale'
            },
            preparationTime: {
              type: 'number',
              description: 'Tempo di preparazione stimato in minuti'
            },
            status: {
              type: 'string',
              enum: ['confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'picked_up'],
              description: 'Stato dell\'ordine'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data di creazione'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data ultimo aggiornamento'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            msg: {
              type: 'string',
              description: 'Messaggio di errore'
            },
            success: {
              type: 'boolean',
              description: 'Indica se l\'operazione è riuscita'
            },
            message: {
              type: 'string',
              description: 'Messaggio descrittivo'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica se l\'operazione è riuscita'
            },
            message: {
              type: 'string',
              description: 'Messaggio di successo'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticazione',
        description: 'Operazioni di login, registrazione e gestione profilo'
      },
      {
        name: 'Menu Pubblico',
        description: 'Visualizzazione menu e ristoranti disponibili'
      },
      {
        name: 'Menu Ristoratore',
        description: 'Gestione menu per ristoratori'
      },
      {
        name: 'Piatti',
        description: 'Gestione e ricerca dei piatti'
      },
      {
        name: 'Carrello',
        description: 'Gestione del carrello acquisti'
      },
      {
        name: 'Ordini',
        description: 'Gestione ordini per clienti e ristoratori'
      },
      {
        name: 'Statistiche',
        description: 'Statistiche per ristoratori'
      }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;