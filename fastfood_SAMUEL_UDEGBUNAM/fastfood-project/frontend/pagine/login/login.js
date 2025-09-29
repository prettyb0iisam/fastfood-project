const form = document.getElementById('loginForm');
const errore = document.getElementById('errore');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errore.textContent = '';
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const submitButton = form.querySelector('button');
  
  submitButton.disabled = true;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const json = await res.json();

    if (!res.ok) {
      errore.textContent = json.msg || 'Errore nel login';
    } else {
      window.location.href = '/profile';
    }

  } catch (err) {
    errore.textContent = 'Errore di rete';
  } finally {
    submitButton.disabled = false;
  }
});
