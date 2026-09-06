const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  toggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
  }
});
document.querySelector('#demo-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = `Demo enquiry — ${data.get('organisation')}`;
  const body = `Hello Samantar Labs,\n\nI'd like to arrange a demo.\n\nName: ${data.get('name')}\nOrganisation: ${data.get('organisation')}\nEmail: ${data.get('email')}\n\nWhere work slows down:\n${data.get('message') || 'Let’s discuss on the call.'}\n`;
  window.location.href = `mailto:hello@samantarlabs.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.querySelector('#form-status').textContent = 'Your email draft is ready to open. Send it in your email app to complete your enquiry. If no app opens, email hello@samantarlabs.com directly.';
});
