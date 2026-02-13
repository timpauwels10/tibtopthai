// Reviews carousel auto-scroll (optional enhancement)
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.reviews-carousel');
  if (!carousel) return;

  let scrollInterval;
  const scrollSpeed = 1;
  const scrollDelay = 30;

  function startAutoScroll() {
    scrollInterval = setInterval(() => {
      carousel.scrollLeft += scrollSpeed;
      // Reset when reaching the end
      if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth) {
        carousel.scrollLeft = 0;
      }
    }, scrollDelay);
  }

  // Pause on hover/touch
  carousel.addEventListener('mouseenter', () => clearInterval(scrollInterval));
  carousel.addEventListener('mouseleave', startAutoScroll);
  carousel.addEventListener('touchstart', () => clearInterval(scrollInterval), { passive: true });
  carousel.addEventListener('touchend', () => setTimeout(startAutoScroll, 3000));

  // Start after a short delay
  setTimeout(startAutoScroll, 2000);
});
