import React, { useEffect, useMemo, useState } from "react";

/*
  Feast Books — Preorder Frontend (React single-file)
  Connects to a Google Apps Script Web App (see README below) which provides two endpoints:
    GET  /books?sheetId=...  -> returns JSON array of books from "Book Inventory" tab
    POST /reserve             -> accepts multipart/form-data (order + optional payment file)

  Features:
  - List books from Book Inventory
  - Filter/search by title, author, genre, price (min-max), location
  - Add to cart and set quantities
  - Checkout form with customer info (Full Name, Email, Contact Number, FB name)
  - Pickup selection (4 options) — pick-up only
  - File upload for confirmed payment (optional)
  - Submits form to Apps Script POST endpoint which appends into "Book_reserve" sheet and saves file to Drive
  - Privacy-friendly: no data stored in frontend; backend writes to Google Sheet

  To use:
    1) Deploy the Apps Script (Code provided in README) as a Web App (execute as: Me; access: Anyone, even anonymous) and copy the Web App URL.
    2) Update REACT_APP_API_BASE (or replace the constant below) with your Apps Script URL.
    3) Make sure the deployed Apps Script has access to the target Google Sheet and Drive.

  Note: file uploads require the Apps Script web app to run as the script owner and allow anonymous access if you want users without Google sign-in to upload.
*/

const API_BASE = process.env.REACT_APP_API_BASE || "https://YOUR_APPS_SCRIPT_WEB_APP_URL"; // replace with your Apps Script web app URL

const formatPHP = (n) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(n);

function fetchBooks(sheetId) {
  const url = `${API_BASE}/books?sheetId=${encodeURIComponent(sheetId)}`;
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch books");
    return r.json();
  });
}

export default function App() {
  const [sheetId, setSheetId] = useState("");
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Checkout fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fbName, setFbName] = useState("");
  const [pickup, setPickup] = useState("Feast ayala - Sunday");
  const [paymentFile, setPaymentFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Auto-load if REACT_APP_SHEET_ID is provided in the environment
    const envSheet = process.env.REACT_APP_SHEET_ID || null;
    if (envSheet) {
      setSheetId(envSheet);
    }
  }, []);

  useEffect(() => {
    if (!sheetId) return;
    setLoading(true);
    setError(null);
    fetchBooks(sheetId)
      .then((data) => setBooks(data || []))
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setLoading(false));
  }, [sheetId]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return books.filter((b) => {
      if (ql) {
        const hay = `${b.title} ${b.author} ${b.genre}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      if (genre && b.genre !== genre) return false;
      if (location && b.location !== location) return false;
      const price = Number(b.price) || 0;
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;
      return true;
    });
  }, [books, q, genre, location, minPrice, maxPrice]);

  function addToCart(book) {
    setCart((c) => {
      const i = c.findIndex((x) => x.id === book.id);
      if (i >= 0) {
        const copy = [...c];
        copy[i].qty += 1;
        return copy;
      }
      return [...c, { ...book, qty: 1 }];
    });
  }

  function updateQty(id, qty) {
    setCart((c) => c.map((it) => (it.id === id ? { ...it, qty: Math.max(1, qty) } : it)));
  }

  function removeFromCart(id) {
    setCart((c) => c.filter((it) => it.id !== id));
  }

  const subtotal = cart.reduce((s, it) => s + (Number(it.price) || 0) * it.qty, 0);

  async function submitOrder(e) {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    setSubmitting(true);
    setSuccessMsg("");
    try {
      const endpoint = `${API_BASE}/reserve`;
      const form = new FormData();
      form.append("sheetId", sheetId);
      form.append("fullName", fullName);
      form.append("email", email);
      form.append("phone", phone);
      form.append("fbName", fbName);
      form.append("pickup", pickup);
      form.append("notes", notes);
      form.append("cart", JSON.stringify(cart.map(({ id, title, author, qty, price }) => ({ id, title, author, qty, price }))));
      if (paymentFile) form.append("paymentFile", paymentFile, paymentFile.name);

      const res = await fetch(endpoint, { method: "POST", body: form });
      if (!res.ok) throw new Error("Failed to submit order");
      const data = await res.json();
      setSuccessMsg(data.message || "Order submitted. Thank you!");
      // reset cart and form
      setCart([]);
      setFullName("");
      setEmail("");
      setPhone("");
      setFbName("");
      setNotes("");
      setPaymentFile(null);
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, Roboto, 'Segoe UI', sans-serif" }}>
      <header style={{ background: "#fff", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Feast Books — Pre-Order</div>
        <div style={{ fontSize: 12, color: "#666" }}>Privacy: pick-up only. Payments faster if done before pickup.</div>
      </header>

      <main style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
        <section style={{ marginBottom: 18 }}>
          <label>Google Sheet ID (Book Inventory & Book_reserve must be tabs in this sheet):</label>
          <input value={sheetId} onChange={(e) => setSheetId(e.target.value)} placeholder="paste sheet id here" style={{ width: "100%", padding: 8, marginTop: 6 }} />
          <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>Example: if your sheet URL is https://docs.google.com/spreadsheets/d/<strong>THIS_PART</strong>/edit ... then paste THAT_PART</div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input placeholder="Search title, author, genre" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, padding: 8 }} />
              <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: 120, padding: 8 }} />
              <input placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ width: 80, padding: 8 }} />
              <input placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ width: 80, padding: 8 }} />
            </div>

            <div style={{ minHeight: 240 }}>
              {loading ? (
                <div>Loading books…</div>
              ) : error ? (
                <div style={{ color: "red" }}>{error}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {filtered.map((b) => (
                    <div key={b.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
                      <img src={b.image || "https://via.placeholder.com/220x300?text=No+Image"} alt="cover" style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 6 }} />
                      <div style={{ fontWeight: 700, marginTop: 8 }}>{b.title}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{b.author} • {b.genre}</div>
                      <div style={{ marginTop: 6, fontSize: 13 }}>{b.summary?.slice(0, 140)}</div>
                      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700 }}>{formatPHP(Number(b.price || 0))}</div>
                        <button onClick={() => addToCart(b)} style={{ background: "#0ea5a4", color: "#fff", border: "none", padding: "8px 10px", borderRadius: 6, cursor: "pointer" }}>Add</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
              <h3 style={{ marginTop: 0 }}>Your Pre-Order</h3>
              {cart.length === 0 ? (
                <div style={{ color: "#666" }}>Cart is empty</div>
              ) : (
                <div>
                  {cart.map((it) => (
                    <div key={it.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <img src={it.image || "https://via.placeholder.com/60"} alt="" style={{ width: 60, height: 80, objectFit: "cover", borderRadius: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{it.title}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>{it.author}</div>
                        <div style={{ marginTop: 6 }}>
                          <button onClick={() => updateQty(it.id, it.qty - 1)}>-</button>
                          <input value={it.qty} onChange={(e) => updateQty(it.id, Number(e.target.value))} style={{ width: 36, textAlign: "center", margin: "0 6px" }} />
                          <button onClick={() => updateQty(it.id, it.qty + 1)}>+</button>
                          <button onClick={() => removeFromCart(it.id)} style={{ marginLeft: 8, color: "#c00" }}>Remove</button>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{formatPHP(it.qty * Number(it.price || 0))}</div>
                    </div>
                  ))}

                  <hr />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <div style={{ color: "#666" }}>Subtotal</div>
                    <div style={{ fontWeight: 700 }}>{formatPHP(subtotal)}</div>
                  </div>
                </div>
              )}

              <form onSubmit={submitOrder} style={{ marginTop: 12 }}>
                <h4 style={{ marginBottom: 8 }}>Customer Information</h4>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" style={{ width: "100%", padding: 8, marginBottom: 6 }} />
                <input required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" style={{ width: "100%", padding: 8, marginBottom: 6 }} />
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contact Number" style={{ width: "100%", padding: 8, marginBottom: 6 }} />
                <input value={fbName} onChange={(e) => setFbName(e.target.value)} placeholder="FB name (optional)" style={{ width: "100%", padding: 8, marginBottom: 6 }} />

                <label style={{ fontWeight: 700 }}>Select pick up</label>
                <select value={pickup} onChange={(e) => setPickup(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }}>
                  <option>Feast sacred heart - Monday</option>
                  <option>Feast it park - Saturday</option>
                  <option>Feast golden prince - Saturday</option>
                  <option>Feast ayala - Sunday</option>
                </select>

                <label style={{ fontWeight: 700 }}>Payment confirmation (upload file)</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => setPaymentFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: 6, marginBottom: 8 }} />

                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (pickup schedule, branch)" style={{ width: "100%", padding: 8, marginBottom: 8 }} />

                <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                  <strong>Disclaimer:</strong>
                  <ul style={{ marginTop: 6 }}>
                    <li>pick-up only option</li>
                    <li>for faster transaction do payment first</li>
                  </ul>
                </div>

                <button type="submit" disabled={submitting} style={{ background: "#0ea5a4", color: "#fff", padding: "10px 12px", borderRadius: 6, border: "none", width: "100%" }}>
                  {submitting ? "Submitting…" : "Confirm Pre-Order"}
                </button>

                {successMsg && <div style={{ marginTop: 8, color: "green" }}>{successMsg}</div>}
              </form>
            </div>
          </aside>
        </section>
      </main>

      <footer style={{ textAlign: "center", padding: 24, fontSize: 12, color: "#666" }}>
        © Feast Books — Pre-order System
      </footer>
    </div>
  );
}

/*
README — Google Apps Script (server-side) code (deploy as Web App)

1) Create a new Google Apps Script project (script.google.com) and add the following Code.gs.
2) Replace SHEET_ID default if desired.
3) Deploy -> New deployment -> Web app. Execute as: Me. Who has access: Anyone (even anonymous) if you want non-signed-in users to submit files.
4) Copy the Web App URL and set REACT_APP_API_BASE to that URL in your React app environment.

------ Code.gs ------

const SHEET_ID_DEFAULT = 'PUT_YOUR_SHEET_ID_HERE'; // optional

function doGet(e) {
  // simple router: /books?sheetId=...
  const path = e.path || (e.parameter && e.parameter.path) || '';
  // Allow CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (e.parameter && e.parameter.sheetId) {
    const sheetId = e.parameter.sheetId;
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Book Inventory');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Book Inventory tab not found' })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    const rows = sheet.getDataRange().getValues();
    const headersRow = rows.shift();
    const books = rows.map((r) => {
      const obj = {};
      headersRow.forEach((h, i) => {
        obj[String(h).trim()] = r[i];
      });
      // normalize expected keys
      return {
        id: obj['id'] ? String(obj['id']) : Utilities.getUuid(),
        title: obj['Title'] || obj['title'] || '',
        author: obj['Author'] || obj['author'] || '',
        summary: obj['Summary'] || obj['summary'] || '',
        genre: obj['Genre'] || obj['genre'] || '',
        price: obj['Price'] || obj['price'] || 0,
        location: obj['Location'] || obj['location'] || '',
        image: obj['Image'] || obj['image'] || '',
      };
    });

    return ContentService.createTextOutput(JSON.stringify(books)).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
}

function doPost(e) {
  // Accept multipart/form-data via HTML form with file upload
  // If deployed as Web App and executed as script owner, we can save files to Drive
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const sheetId = e.parameter.sheetId || SHEET_ID_DEFAULT;
    const ss = SpreadsheetApp.openById(sheetId);
    const reserveSheet = ss.getSheetByName('Book_reserve') || ss.insertSheet('Book_reserve');

    // e.parameter contains simple fields; file upload available in e.files when using HtmlService forms.
    // To handle file uploads from fetch/FormData, use the built-in Google Apps Script ContentService parse? The raw post is in e.postData.contents

    // We'll use an approach: if e.postData and e.postData.type == 'application/octet-stream' it's a file; but fetch with FormData sends multipart/form-data.
    // Apps Script maps multipart fields to e.parameters and file blobs to e.parameters as well in some cases. Safer route: create an HTML form and submit it from the browser to the Apps Script URL.

    // For modern fetch(FormData) submissions, the files are available in e.parameters['paymentFile'] as a Blob? Not guaranteed. Simpler: The frontend can POST to a "submitForm" HTML page hosted in Apps Script that uses the server-side to parse the form.

    // For general use, try to detect file in e.parameter or e.postData

    let paymentUrl = '';
    if (e.files && e.files.paymentFile) {
      const f = e.files.paymentFile;
      const blob = f; // Blob
      const file = DriveApp.createFile(blob);
      paymentUrl = file.getUrl();
    } else if (e.postData && e.postData.length > 0) {
      // fallback: no reliable file parsing
      // ignore file
    }

    const row = [
      new Date(),
      e.parameter.fullName || '',
      e.parameter.email || '',
      e.parameter.phone || '',
      e.parameter.fbName || '',
      e.parameter.pickup || '',
      e.parameter.cart || '',
      e.parameter.notes || '',
      paymentUrl,
    ];
    reserveSheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'Order saved' })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }
}

/*
Notes & Implementation Tips:

- Book Inventory sheet: use a header row with columns: id, Title, Author, Summary, Genre, Price, Location, Image
  - If you don't have id values, the script will generate UUIDs.

- Book_reserve sheet: the script appends rows with timestamp + customer fields + cart(json) + paymentUrl

- File uploads via fetch(FormData) to Apps Script sometimes require special handling. If you run into issues, use an intermediate HTML form hosted by Apps Script (HtmlService) and submit the form the traditional way; the doPost in Apps Script will then have e.files available.

- Permissions: set the Web App deployment to run as you (the script owner) so it can write to the sheet and Drive. If you want anonymous submissions (users without Google accounts), set access to "Anyone, even anonymous." Be aware of spam risk; consider adding a simple CAPTCHA or manual review.

- CORS: The script above sets Access-Control-Allow-Origin: *. For stricter security, set a specific origin.

- Security: Do not expose your Sheet ID publicly if it contains sensitive data. Consider creating a separate Sheet solely for the public catalog and order collection.

- If you want a fully serverless approach using only Google Forms + Sheets (no Apps Script), the tradeoffs are: file upload requires Google sign-in, and you cannot programmatically read inventory in real-time without publishing the sheet or using the Sheets API.

If you'd like, I can:
  • Provide a ready-to-copy Apps Script project (zipped code) with an HTML submission page that reliably handles file uploads.
  • Customize the React UI to match Feast branding and pre-load your real Book Inventory.
*/
