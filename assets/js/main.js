// Mobile navigation toggle
const toggle = document.getElementById('nav-toggle');
const links  = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  const isOpen = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', isOpen);
});

// Mobile Services dropdown — tap to open/close
// On desktop, CSS :hover handles it. On touch devices, we need a click handler.
const hasDropdowns = document.querySelectorAll('.has-dropdown');

hasDropdowns.forEach(item => {
  const trigger = item.querySelector('a');
  trigger.addEventListener('click', (e) => {
    // Only intercept on mobile (when toggle is visible)
    if (window.getComputedStyle(toggle).display !== 'none') {
      e.preventDefault();
      const isExpanded = item.classList.toggle('open');
      trigger.setAttribute('aria-expanded', isExpanded);
    }
  });
});

// Close mobile nav + dropdowns when a dropdown item is clicked
document.querySelectorAll('.dropdown-menu a').forEach(link => {
  link.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    hasDropdowns.forEach(d => d.classList.remove('open'));
  });
});if(window.innerWidth<=768){var d=document.querySelector('.has-dropdown');if(d){d.querySelector('a').addEventListener('click',function(e){e.preventDefault();d.classList.toggle('open');});}}
