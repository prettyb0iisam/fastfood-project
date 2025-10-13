document.addEventListener('DOMContentLoaded', () => {
  const demoAccessBtn = document.getElementById('demoAccessBtn');
  const demoPopup = document.getElementById('demoPopup');
  const demoClienteBtn = document.getElementById('demoClienteBtn');
  const demoRistoratoreBtn = document.getElementById('demoRistoratoreBtn');
  
  demoAccessBtn.addEventListener('click', () => {
    demoPopup.style.display = 'flex';
  });

  demoPopup.addEventListener('click', (e) => {
    if (e.target === demoPopup) {
      demoPopup.style.display = 'none';
    }
  });

  demoClienteBtn.addEventListener('click', async () => {
    await performDemoLogin('demo@cliente.it', 'demo');
  });

  demoRistoratoreBtn.addEventListener('click', async () => {
    await performDemoLogin('demo@ristorante.it', 'demo');
  });

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
        window.location.href = '/noregister-menu';
      } else {
        window.location.href = '/profile';
      }

    } catch (err) {
      console.error('Network error:', err);
      window.location.href = '/noregister-menu';
    }
  }
});
