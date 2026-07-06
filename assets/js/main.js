// Mobile navigation toggle
const toggle = document.getElementById('nav-toggle');
const links  = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  const isOpen = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', isOpen);
});