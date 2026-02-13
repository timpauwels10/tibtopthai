// Cart system (localStorage)
document.addEventListener('DOMContentLoaded', () => {
  const CART_KEY = 'tibtopthai_cart';
  const TYPE_KEY = 'tibtopthai_order_type';

  // --- State ---
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  let orderType = localStorage.getItem(TYPE_KEY) || 'pickup';

  // --- DOM refs ---
  const cartItemsEl = document.getElementById('cart-items');
  const cartEmptyEl = document.getElementById('cart-empty');
  const cartTotalEl = document.getElementById('cart-total');
  const cartCountEl = document.getElementById('cart-count');
  const cartToggle = document.getElementById('cart-toggle');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartClose = document.getElementById('cart-close');
  const deliveryFields = document.querySelector('.delivery-fields');
  const checkoutForm = document.getElementById('checkout-form');
  const submitBtn = document.getElementById('submit-order');

  // --- Order type toggle ---
  const typeBtns = document.querySelectorAll('.order-type-btn');
  typeBtns.forEach(btn => {
    if (btn.dataset.type === orderType) btn.classList.add('active');
    btn.addEventListener('click', () => {
      orderType = btn.dataset.type;
      localStorage.setItem(TYPE_KEY, orderType);
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (deliveryFields) {
        deliveryFields.classList.toggle('visible', orderType === 'delivery');
      }
    });
  });

  // Initialize delivery fields visibility
  if (deliveryFields && orderType === 'delivery') {
    deliveryFields.classList.add('visible');
  }

  // --- Add to cart ---
  document.querySelectorAll('.order-item__add').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);

      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.quantity++;
      } else {
        cart.push({ id, name, price, quantity: 1 });
      }

      saveCart();
      renderCart();

      // Brief animation feedback
      btn.style.transform = 'scale(1.3)';
      setTimeout(() => { btn.style.transform = ''; }, 200);
    });
  });

  // --- Cart rendering ---
  function renderCart() {
    if (!cartItemsEl) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update toggle button
    if (cartToggle) {
      cartToggle.textContent = `Winkelwagen (${totalItems}) — €${totalPrice.toFixed(2)}`;
    }

    // Update count badge
    if (cartCountEl) {
      cartCountEl.textContent = totalItems;
    }

    if (cart.length === 0) {
      cartItemsEl.innerHTML = '';
      if (cartEmptyEl) cartEmptyEl.style.display = '';
      if (cartTotalEl) cartTotalEl.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    if (cartEmptyEl) cartEmptyEl.style.display = 'none';
    if (cartTotalEl) {
      cartTotalEl.style.display = '';
      cartTotalEl.querySelector('.cart__total-amount').textContent = `€${totalPrice.toFixed(2)}`;
    }
    if (submitBtn) submitBtn.disabled = false;

    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item__qty">
          <button class="cart-qty-minus" data-id="${item.id}" aria-label="Vermin">−</button>
          <span>${item.quantity}</span>
          <button class="cart-qty-plus" data-id="${item.id}" aria-label="Verhoog">+</button>
        </div>
        <span class="cart-item__name">${item.name}</span>
        <span class="cart-item__price">€${(item.price * item.quantity).toFixed(2)}</span>
        <button class="cart-item__remove" data-id="${item.id}" aria-label="Verwijder">&times;</button>
      </div>
    `).join('');

    // Bind quantity buttons
    cartItemsEl.querySelectorAll('.cart-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = cart.find(i => i.id === btn.dataset.id);
        if (item) {
          item.quantity--;
          if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== btn.dataset.id);
          }
          saveCart();
          renderCart();
        }
      });
    });

    cartItemsEl.querySelectorAll('.cart-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = cart.find(i => i.id === btn.dataset.id);
        if (item) {
          item.quantity++;
          saveCart();
          renderCart();
        }
      });
    });

    cartItemsEl.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        cart = cart.filter(i => i.id !== btn.dataset.id);
        saveCart();
        renderCart();
      });
    });
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // --- Mobile cart drawer ---
  if (cartToggle && cartDrawer) {
    cartToggle.addEventListener('click', () => {
      cartDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (cartClose && cartDrawer) {
    cartClose.addEventListener('click', () => {
      cartDrawer.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // --- Checkout submission ---
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (cart.length === 0) return;

      const formData = new FormData(checkoutForm);
      const payload = {
        type: orderType,
        customerName: formData.get('name'),
        customerPhone: formData.get('phone'),
        customerEmail: formData.get('email') || null,
        customerAddress: orderType === 'delivery' ? formData.get('address') : null,
        notes: formData.get('notes') || null,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Bezig met verwerken...';

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Er ging iets mis.');
        }

        // Clear cart
        cart = [];
        saveCart();

        // Redirect to Mollie or confirmation
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          window.location.href = `/bestel/bevestiging?order=${data.orderId}`;
        }
      } catch (err) {
        alert(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Betaal & Bestel';
      }
    });
  }

  // Initial render
  renderCart();
});
