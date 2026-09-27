// ============================================
// Paw & Prosper: navigation
// ============================================
const toggle = document.getElementById('nav-toggle');
const links  = document.getElementById('nav-links');
const dropdowns = document.querySelectorAll('.has-dropdown');

// Mobile layout = hamburger button is visible
const isMobileNav = () => toggle && window.getComputedStyle(toggle).display !== 'none';

function closeDropdowns() {
  dropdowns.forEach(d => {
    d.classList.remove('open');
    const t = d.querySelector(':scope > a');
    if (t) t.setAttribute('aria-expanded', 'false');
  });
}

// Hamburger toggle
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    if (!isOpen) closeDropdowns();
  });
}

// Services accordion on mobile (desktop uses CSS hover)
dropdowns.forEach(item => {
  const trigger = item.querySelector(':scope > a');
  const menu = item.querySelector('.dropdown-menu');
  if (!trigger || !menu) return;

  // Keep the Services overview page reachable on mobile
  if (!menu.querySelector('.dropdown-menu__all')) {
    const li = document.createElement('li');
    li.className = 'dropdown-menu__all';
    li.innerHTML = '<a href="' + trigger.getAttribute('href') + '">All Services</a>';
    menu.prepend(li);
  }

  trigger.setAttribute('aria-expanded', 'false');
  trigger.addEventListener('click', e => {
    if (!isMobileNav()) return;
    e.preventDefault();
    const isOpen = item.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen);
  });
});

// Close everything when a menu link is tapped
document.querySelectorAll('.dropdown-menu a').forEach(link => {
  link.addEventListener('click', () => {
    if (links) links.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    closeDropdowns();
  });
});
