
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// søkefunksjon

function search() {
    // Get what the user typed in the search box
    const input = document.getElementById('searchInput').value.toLowerCase();
    // Counter for how many products match
    let found = 0;

     // Loop through all product cards on the page
    document.querySelectorAll('.card').forEach(function(card) {
        // Get product name from the card (stored in data-name)
        const name = card.dataset.name.toLowerCase();
        // Check if product name contains search text
        if (name.includes(input)) {
            card.classList.remove('hidden');   // show card
            found = found + 1;                 // increase match count
        } else {
            card.classList.add('hidden');      // hide card
        }  
    });

    // If nothing matched, show "no results"
    if (found === 0) {
        document.getElementById('noResults').classList.remove('hidden');
    } else {
        document.getElementById('noResults').classList.add('hidden');
    }
}
// When user clicks search button → run search()
document.getElementById('searchBtn').addEventListener('click', search);
// When user types → run search live (real-time filtering)
document.getElementById('searchInput').addEventListener('input', search);








// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// log in og registrering

// Switch between Login and Register forms
function switchTab(tab) {
    // If user clicked "Login"
    if (tab === 'login') {
        document.getElementById('loginForm').classList.remove('hidden'); // show login form
        document.getElementById('registerForm').classList.add('hidden'); // hide register form
    } else {
        document.getElementById('loginForm').classList.add('hidden');         // hide login form
        document.getElementById('registerForm').classList.remove('hidden');   // show register form
    }
}

// Login function
async function doLogin() {

    // Get values from input fields
    const email    = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;

    // Send login request to Flask backend
    const response = await fetch('/api/login', {
        method:  'POST',
        // Tell server were sending json
        headers: { 'Content-Type': 'application/json' },
        // Convert JS object to JSON text
        body:    JSON.stringify({ email, password })
    });

    // Read JSON response from server
    const result = await response.json();

    // If login succeeded
    if (result.ok) {
        location.reload(); // reload page
    } else {
        // Show error message
        document.getElementById('loginError').textContent = result.error;
        document.getElementById('loginError').classList.remove('hidden');
    }
}

// Register function
async function doRegister() {
    // Get values from registration form
    const name     = document.getElementById('regName').value;
    const email    = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;

    // Send registration request to backend
    const response = await fetch('/api/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send name, email and password as JSON
        body:    JSON.stringify({ name, email, password })
    });

    // Read server response
    const result = await response.json();

    // If registration succeeded
    if (result.ok) {
        location.reload(); // reload page
    } else {
        // Show error message
        document.getElementById('registerError').textContent = result.error;
        document.getElementById('registerError').classList.remove('hidden');
    }
}

// Logout function
async function doLogout() {
    // Tell server to log user out
    await fetch('/api/logout', { method: 'POST' });
    location.reload();  // Refresh page after logout
}






// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// handlekurv

// Object that stores all cart items
const cart = {};

// Runs when user clicks "Add to cart"
function addToCart(button) {
    // Find the product card that contains the button
    const card  = button.closest('.card');
    // Get product info from data-* attributes
    const id    = card.dataset.id;
    const name  = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    const image = card.dataset.image;

    // If product is not already in cart
    if (!cart[id]) {
        // Create new cart item
        cart[id] = { name, price, image, qty: 0 };
    }

    // Increase quantity by 1
    cart[id].qty = cart[id].qty + 1;

    updateCart(); // Refresh cart display
    openCart();   // Open cart drawer
}

// Change quantity (+1 or -1)
function changeQty(id, change) {
    // Add change to quantity
    cart[id].qty = cart[id].qty + change;
     // Prevent negative numbers
    if (cart[id].qty < 0) {
        cart[id].qty = 0;
    }
    // Refresh cart display
    updateCart();
}

// Updates everything shown in the cart
function updateCart() {
    let html       = '';  // cart HTML
    let totalPrice = 0;   // total price
    let totalItems = 0;   // total item count

    // Loop through every item in cart
    for (const id in cart) {
        const item = cart[id];
        // Skip items with quantity 0
        if (item.qty === 0) continue;
        
        // Add to totals
        totalPrice = totalPrice + (item.price * item.qty);
        totalItems = totalItems + item.qty;

        // Build cart item HTML
        html = html + `
            <div class="cart-row">
                <img src="/static/images/${item.image}" alt="${item.name}">
                <div class="cart-row-info">
                    <div class="cart-row-name">${item.name}</div>
                    <div class="cart-row-price">${item.price} kr × ${item.qty}</div>
                </div>
                <div class="cart-row-qty">
                    <button onclick="changeQty('${id}', -1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty('${id}', 1)">+</button>
                </div>
            </div>`;
    }

    // If cart is empty
    if (html === '') {
        html = '<p class="empty-msg">Kurven er tom.</p>';
    }

    // Put cart items into page
    document.getElementById('cartItems').innerHTML   = html;
    // Show total price
    document.getElementById('cartTotal').textContent = totalPrice.toFixed(0) + ' kr';

    // Update cart badge
    const badge = document.getElementById('cartBadge');
    badge.textContent = totalItems;

    // Hide badge if no items
    if (totalItems === 0) {
        badge.classList.add('hidden');
    } else {
        badge.classList.remove('hidden');
    }
}



// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// handlekurv skuff

// Opens the cart drawer
function openCart() {
    // Add "open" class to cart drawer (makes it visible)
    document.getElementById('cartDrawer').classList.add('open');
    // Close account drawer if it's open
    document.getElementById('userDrawer').classList.remove('open');
    // Show dark overlay behind drawer
    document.getElementById('drawerOverlay').classList.add('open');
}

// Closes the cart drawer
function closeCart() {
    // Hide cart drawer
    document.getElementById('cartDrawer').classList.remove('open');
    // Hide dark overlay
    document.getElementById('drawerOverlay').classList.remove('open');
}

// When the cart button is clicked
document.getElementById('cartBtn').addEventListener('click', openCart);

// When the dark overlay is clicked
document.getElementById('drawerOverlay').addEventListener('click', function() {
    // Close account drawer
    closeUser();
    // Close cart drawer
    closeCart();
});

// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// CHECKOUT

// Runs when user clicks "Checkout"
async function doCheckout() {
    // If user is not logged in
    if (!window.LOGGED_IN) {
        // Close cart drawer
        closeCart();
        // Open login/account drawer
        openUser();
        // Stop here
        return;
    }

    // Array that will hold products being ordered
    const items = [];
    // Loop through every product in cart
    for (const id in cart) {
        // Only include products with quantity > 0
        if (cart[id].qty > 0) {
            items.push({
                id:    id,
                name:  cart[id].name,
                price: cart[id].price,
                qty:   cart[id].qty
            });
        }
    }

    // If cart is empty, stop
    if (items.length === 0) return;

    // Send order to Flask backend
    const response = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // Convert items array to JSON
        body:    JSON.stringify({ items })
    });

    // Read server response
    const result = await response.json();

    // If backend returned an error
    if (!result.ok) {
        // Show error message
        alert(result.error);
        return;
        // Order succeeded
    }

    // Remove all products from cart
    for (const id in cart) {
        delete cart[id];
    }

    // Refresh cart UI
    updateCart();
    // Close cart drawer
    closeCart();
    // Show success message with order ID
    alert('Bestilling #' + result.order_id + ' er lagt inn!');
}







// Show profile instead of login form if user is logged in
if (window.LOGGED_IN) {
    // Hide login/register section
    document.getElementById('authPanel').classList.add('hidden');
    // Show profile section
    document.getElementById('profilePanel').classList.remove('hidden');
    // Display user's name
    document.getElementById('profileName').textContent = 'Logget inn som: ' + window.USER_NAME;
}