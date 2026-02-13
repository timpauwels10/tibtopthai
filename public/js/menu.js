// Menu page: tab filtering + order buttons
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.menu-tab');
  const categories = document.querySelectorAll('.menu-category');

  if (!tabs.length || !categories.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.category;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show/hide categories
      if (target === 'all') {
        categories.forEach(c => c.style.display = '');
      } else {
        categories.forEach(c => {
          c.style.display = c.dataset.category === target ? '' : 'none';
        });
      }

      // Smooth scroll to the category
      if (target !== 'all') {
        const el = document.querySelector(`.menu-category[data-category="${target}"]`);
        if (el) {
          const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
          const tabsHeight = document.querySelector('.menu-tabs')?.offsetHeight || 0;
          const offset = headerHeight + tabsHeight + 16;
          const y = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });
});
