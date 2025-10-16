(function(){
  const titleEl = document.getElementById('heroTitle');
  const subtitleEl = document.getElementById('heroSubtitle');
  const ctaEl = document.getElementById('ctaPrimary');
  const btnIT = document.getElementById('btnIT');
  const btnEN = document.getElementById('btnEN');

  const itSubtitle = `FastFood Project è una webapp sviluppata per un progetto universitario.<br>
  L'obiettivo è creare una piattaforma che permetta ai clienti di ordinare piatti e ai ristoratori di gestire menù e ordini in modo semplice e veloce.<br>
  Tutti i ristoranti e i piatti presenti sono completamente fittizi, realizzati esclusivamente a scopo dimostrativo.<br>
  Sviluppata con Node.js, Express e MongoDB, integra autenticazione a sessione, API REST e un frontend dinamico in HTML/CSS/JavaScript.<br>
  Il focus è offrire un'esperienza moderna, intuitiva e fluida, con un'interfaccia chiara e una UX curata nei dettagli.<br>
  Realizzata in ambiente Cursor con approccio vibecoding, il progetto mi ha permesso di conseguire 30/30 all'esame Programmazione Web e Mobile (UniMi).`;

  const enSubtitle = `FastFood Project is a web app developed for a university project.<br>
  The goal is to create a platform that allows customers to order meals and restaurant owners to manage menus and orders easily and efficiently.<br>
  All restaurants and dishes featured are completely fictional, created for demonstration purposes only.<br>
  Developed with Node.js, Express, and MongoDB, it integrates session-based auth, REST APIs, and a dynamic frontend built with HTML/CSS/JS.<br>
  The focus is to provide a modern, intuitive, and smooth experience, with a clean interface and a carefully designed UX.<br>
  Built in the Cursor environment using a vibecoding approach, the project earned me a 30/30 grade in the Programmazione Web e Mobile exam at UniMi.<br>
  The web app is fully developed in Italian, although certain dish details are in English.`;

  function setActive(isIT){
    btnIT.classList.toggle('active', isIT);
    btnEN.classList.toggle('active', !isIT);
    btnIT.setAttribute('aria-pressed', String(isIT));
    btnEN.setAttribute('aria-pressed', String(!isIT));
  }

  function apply(lang){
    if(lang === 'en'){
      titleEl.textContent = 'FastFood Project by Samuel Udegbunam';
      subtitleEl.innerHTML = enSubtitle;
      ctaEl.textContent = 'View';
      setActive(false);
    } else {
      titleEl.textContent = 'FastFood Project di Samuel Udegbunam';
      subtitleEl.innerHTML = itSubtitle;
      ctaEl.textContent = 'Visualizza';
      setActive(true);
    }
    localStorage.setItem('fastfood-lang', lang);
  }

  btnIT.addEventListener('click', () => apply('it'));
  btnEN.addEventListener('click', () => apply('en'));

  const initial = localStorage.getItem('fastfood-lang') || 'it';
  apply(initial);
})();
