document.addEventListener('DOMContentLoaded', () => {
  // Demo access functionality
  const demoAccessBtn = document.getElementById('demoAccessBtn');
  const demoPopup = document.getElementById('demoPopup');
  const demoClienteBtn = document.getElementById('demoClienteBtn');
  const demoRistoratoreBtn = document.getElementById('demoRistoratoreBtn');

  // Show popup when demo access button is clicked
  demoAccessBtn.addEventListener('click', () => {
    demoPopup.style.display = 'flex';
  });

  // Close popup when clicking outside
  demoPopup.addEventListener('click', (e) => {
    if (e.target === demoPopup) {
      demoPopup.style.display = 'none';
    }
  });

  // Demo login as Cliente
  demoClienteBtn.addEventListener('click', async () => {
    await performDemoLogin('demo@cliente.it', 'demo');
  });

  // Demo login as Ristoratore
  demoRistoratoreBtn.addEventListener('click', async () => {
    await performDemoLogin('demo@ristorante.it', 'demo');
  });

  // Function to perform demo login
  async function performDemoLogin(email, password) {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const json = await res.json();

      if (!res.ok) {
        console.error('Login failed:', json.msg || 'Errore nel login');
        // Fallback: redirect to noregister-menu if login fails
        window.location.href = '/noregister-menu';
      } else {
        // Login successful, redirect to profile
        window.location.href = '/profile';
      }

    } catch (err) {
      console.error('Network error:', err);
      // Fallback: redirect to noregister-menu if network error
      window.location.href = '/noregister-menu';
    }
  }
});
