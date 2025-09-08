const API_URL = "https://script.google.com/macros/s/AKfycbwOg4Vt1so9FS9BcizBKfRmZgQG1ydz4fjo3VgtYigq68SGg4uOyJfinagZKpuLDdaohw/exec";

let books = [];
let cart = [];

const bookList = document.getElementById("book-list");
const orderSummary = document.getElementById("order-summary");
const filterDropdown = document.getElementById("filter-dropdown");
const checkoutBtn = document.getElementById("checkout-btn");
const customerForm = document.getElementById("customer-form");

// Fetch books from Google Sheets
fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    books = data;
    renderBooks("title"); // default
  })
  .catch(err => {
    bookList.innerHTML = "<p style='color:red;'>Failed to load books. Check Apps Script.</p>";
    console.error(err);
  });

// Get selected filter type
function getSelectedFilter() {
  return document.querySelector('input[name="filter"]:checked').value;
}

// Event listener for radio buttons
document.querySelectorAll('input[name="filter"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const filter = getSelectedFilter();
    if (filter === "title") {
      filterDropdown.disabled = true;
      renderBooks("title");
    } else {
      filterDropdown.disabled = false;
      populateDropdown(filter);
    }
  });
});

// Populate dropdown with unique authors or genres
function populateDropdown(filter) {
  filterDropdown.innerHTML = "<option value=''>-- Select --</option>";
  const values = [...new Set(books.map(b => b[filter]))];
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    filterDropdown.appendChild(opt);
  });
}

// When dropdown changes → filter books
filterDropdown.addEventListener("change", () => {
  const filter = getSelectedFilter();
  const selected = filterDropdown.value;
  if (selected) {
    renderBooks(filter, selected);
  } else {
    renderBooks(filter);
  }
});

// Toggle book in cart
function toggleBook(index) {
  const book = books[index];
  if (cart.some(c => c.book === book)) {
    cart = cart.filter(c => c.book !== book);
  } else {
    cart.push({ book, quantity: 1 });
  }
  renderOrder();
}

// Render books list
function renderBooks(filter, filterValue = "") {
  bookList.innerHTML = "";
  books.forEach((book, index) => {
    if (filterValue && book[filter] !== filterValue) return;

    const div = document.createElement("div");
    div.className = "book-item";
    let text = "";

    if (filter === "title") {
      text = `${book.title} by ${book.author}`;
    } else if (filter === "author") {
      text = `${book.title}`;
    } else if (filter === "genre") {
      text = `${book.title} by ${book.author}`;
    }

    const checked = cart.some(c => c.book === book) ? "checked" : "";

    div.innerHTML = `
      <label>
        <input type="checkbox" ${checked} value="${index}" onchange="toggleBook(${index})">
        ${text}
      </label>
    `;
    bookList.appendChild(div);
  });
}

// Render order summary as table
function renderOrder() {
  if (cart.length === 0) {
    orderSummary.innerHTML = "<p>No books selected yet.</p>";
    checkoutBtn.style.display = "none";
    customerForm.style.display = "none";
    return;
  }

  let total = 0;
  let html = `
    <table>
      <tr>
        <th>#</th>
        <th>Title</th>
        <th>Author</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Remove</th>
      </tr>
  `;

  cart.forEach((item, idx) => {
    const price = Number(item.book.discounted || item.book.price) * item.quantity;
    total += price;
    html += `
      <tr>
        <td>${idx+1}</td>
        <td>${item.book.title}</td>
        <td>${item.book.author}</td>
        <td>
          <input type="number" min="1" value="${item.quantity}" 
            onchange="updateQuantity(${idx}, this.value)">
        </td>
        <td>₱${price}</td>
        <td><span class="remove-btn" onclick="removeItem(${idx})">❌</span></td>
      </tr>
    `;
  });

  html += `</table><p><b>Total: ₱${total}</b></p>`;
  orderSummary.innerHTML = html;

  checkoutBtn.style.display = "block";
}

// Update quantity
function updateQuantity(index, qty) {
  cart[index].quantity = Number(qty);
  renderOrder();
}

// Remove item
function removeItem(index) {
  cart.splice(index, 1);
  renderOrder();
}

// Show customer form only after checkout
checkoutBtn.addEventListener("click", () => {
  customerForm.style.display = "block";
  checkoutBtn.style.display = "none";
});

// Handle form submit
document.getElementById("order-form").addEventListener("submit", function(e){
  e.preventDefault();

  if(cart.length === 0) {
    alert("Please select at least one book before confirming order.");
    return;
  }

  const formData = new FormData(this);
  const order = {
    fullname: formData.get("fullname"),
    email: formData.get("email"),
    contact: formData.get("contact"),
    fb: formData.get("fb"),
    pickup: formData.get("pickup"),
    pickupdate: formData.get("pickupdate"),
    items: cart,
    total: cart.reduce((sum, i) => sum + Number(i.book.discounted || i.book.price) * i.quantity, 0)
  };

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(order),
    headers: { "Content-Type": "application/json" }
  })
  .then(res => res.json())
  .then(response => {
    alert("Order confirmed! Your Order ID: " + response.orderId);
    this.reset();
    cart = [];
    renderOrder();
    customerForm.style.display = "none";
  })
  .catch(err => {
    alert("Failed to submit order. Please try again.");
    console.error(err);
  });
});
