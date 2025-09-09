import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, BookOpen, ShieldCheck, Printer, Trash2, Plus, Minus, Percent, Tag, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

// ---------- Types
interface Book {
  id: string;
  title: string;
  author: string;
  summary: string;
  genre: string;
  price: number; // base price
  discountPct?: number; // 0-100
  image: string; // URL
}

interface CartItem {
  book: Book;
  qty: number;
}

// ---------- Sample Catalog (editable)
const SAMPLE_BOOKS: Book[] = [
  {
    id: "1",
    title: "How Good People Like You Can Become Rich",
    author: "Bo Sanchez",
    summary:
      "Practical, faith-anchored steps to build wealth the right way: generous, joyful, and sustainable.",
    genre: "Inspirational / Finance",
    price: 385,
    discountPct: 20,
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1080&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "God, Why Does It Hurt?",
    author: "Bo Sanchez",
    summary:
      "A compassionate guide for seasons of suffering—finding meaning, comfort, and healing in God.",
    genre: "Faith & Spirituality",
    price: 375,
    discountPct: 10,
    image:
      "https://images.unsplash.com/photo-1519681390165-cb9e6d23860e?q=80&w=1080&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Inside Matters",
    author: "Rissa Singson Kawpeng",
    summary:
      "Discover the beauty that starts within—stories and prompts to help you glow with God-confidence.",
    genre: "Self‑Discovery / Spiritual",
    price: 450,
    discountPct: 15,
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1080&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Trailblazing Success",
    author: "Rex Mendoza",
    summary:
      "Leadership and money mindsets of top performers—build resilient habits and long-term value.",
    genre: "Business & Leadership",
    price: 385,
    discountPct: 0,
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1080&auto=format&fit=crop",
  },
];

// ---------- Utilities
const formatPHP = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(n);

const discounted = (book: Book) => {
  const pct = Math.max(0, Math.min(100, book.discountPct || 0));
  return Math.round((book.price * (100 - pct)) / 100);
};

// ---------- Component
export default function BookPreorderSite() {
  const [catalog, setCatalog] = useState<Book[]>(SAMPLE_BOOKS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [showContact, setShowContact] = useState(false); // Honor privacy-by-default
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const total = useMemo(
    () => cart.reduce((sum, it) => sum + discounted(it.book) * it.qty, 0),
    [cart]
  );

  const addToCart = (book: Book) => {
    setCart((prev) => {
      const i = prev.findIndex((x) => x.book.id === book.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + 1 };
        return copy;
      }
      return [...prev, { book, qty: 1 }];
    });
  };

  const setQty = (bookId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((x) => (x.book.id === bookId ? { ...x, qty: Math.max(1, qty) } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const removeItem = (bookId: string) => setCart((prev) => prev.filter((x) => x.book.id !== bookId));

  const clearCart = () => setCart([]);

  const printSlip = () => {
    // Pure client-side: encourages Print / Save as PDF
    window.print();
  };

  // Add-your-own-book input (optional, stays on-device)
  const [newBook, setNewBook] = useState<Partial<Book>>({ discountPct: 0 });
  const canAdd = newBook.title && newBook.author && newBook.price && newBook.image;

  const addCustomBook = () => {
    if (!canAdd) return;
    const b: Book = {
      id: Math.random().toString(36).slice(2),
      title: newBook.title!,
      author: newBook.author!,
      summary: newBook.summary || "",
      genre: newBook.genre || "",
      price: Number(newBook.price),
      discountPct: Number(newBook.discountPct || 0),
      image: newBook.image!,
    };
    setCatalog((prev) => [b, ...prev]);
    setNewBook({ discountPct: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6" />
            <span className="font-semibold tracking-tight">Feast Books — Pre‑Order</span>
            <Badge className="ml-2" variant="secondary">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> No data leaves your device
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({cart.reduce((n, x) => n + x.qty, 0)})
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Your Pre‑Order</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-sm text-slate-600">Your cart is empty.</p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <Card key={item.book.id}>
                          <CardContent className="p-4 flex gap-4">
                            <img
                              src={item.book.image}
                              alt={item.book.title}
                              className="w-16 h-16 object-cover rounded-xl"
                            />
                            <div className="flex-1">
                              <div className="font-medium leading-tight">{item.book.title}</div>
                              <div className="text-xs text-slate-500">{item.book.author}</div>
                              <div className="mt-1 flex items-center gap-2 text-sm">
                                <span className="font-semibold">{formatPHP(discounted(item.book))}</span>
                                {item.book.discountPct ? (
                                  <>
                                    <span className="line-through text-slate-400">{formatPHP(item.book.price)}</span>
                                    <Badge variant="outline" className="gap-1"><Percent className="h-3 w-3" />{item.book.discountPct}%</Badge>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="outline" onClick={() => setQty(item.book.id, item.qty - 1)}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                className="w-14 text-center"
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) => setQty(item.book.id, Number(e.target.value))}
                              />
                              <Button size="icon" variant="outline" onClick={() => setQty(item.book.id, item.qty + 1)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => removeItem(item.book.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-600">Subtotal</div>
                        <div className="text-lg font-semibold">{formatPHP(total)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={clearCart} className="w-full">
                          Clear
                        </Button>
                        <Button onClick={printSlip} className="w-full">
                          <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
                        </Button>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Tip: This site is client‑side only. Use “Print / Save PDF” to generate a pre‑order slip. No data is uploaded.
                      </p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-3xl md:text-5xl font-bold tracking-tight"
              >
                Pre‑Order Your Next Read
              </motion.h1>
              <p className="mt-3 text-slate-600 max-w-prose">
                Browse featured Feast titles. Add to your pre‑order and generate a printable slip. 
                <span className="font-semibold"> We don’t record any personal information by default.</span>
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <ShieldCheck className="h-4 w-4" />
                <span>Privacy‑first • Offline‑friendly • No sign‑in</span>
              </div>
            </div>
            <div className="md:justify-self-end">
              <div className="bg-white/70 border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Switch id="contact-switch" checked={showContact} onCheckedChange={setShowContact} />
                  <Label htmlFor="contact-switch" className="cursor-pointer">
                    Optional contact fields
                  </Label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Leave this off to keep it anonymous. Toggle on only if you want to include contact info in your printed slip.
                </p>
                <AnimatePresence>
                  {showContact && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
                    >
                      <Input placeholder="Full name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
                      <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
                      <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add-your-own Book */}
      <section className="max-w-7xl mx-auto px-4 pb-4">
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4" />
            <h2 className="font-semibold">Quick Add a Book (local only)</h2>
          </div>
          <div className="grid md:grid-cols-6 gap-3">
            <Input placeholder="Title" value={newBook.title || ""} onChange={(e) => setNewBook((s) => ({ ...s, title: e.target.value }))} />
            <Input placeholder="Author" value={newBook.author || ""} onChange={(e) => setNewBook((s) => ({ ...s, author: e.target.value }))} />
            <Input placeholder="Genre" value={newBook.genre || ""} onChange={(e) => setNewBook((s) => ({ ...s, genre: e.target.value }))} />
            <Input type="number" placeholder="Price (PHP)" value={newBook.price as any as string || ""} onChange={(e) => setNewBook((s) => ({ ...s, price: Number(e.target.value) }))} />
            <Input type="number" placeholder="Discount %" value={newBook.discountPct as any as string || 0} onChange={(e) => setNewBook((s) => ({ ...s, discountPct: Number(e.target.value) }))} />
            <Input placeholder="Image URL" value={newBook.image || ""} onChange={(e) => setNewBook((s) => ({ ...s, image: e.target.value }))} />
          </div>
          <Textarea className="mt-3" placeholder="Short highlights / summary (optional)" value={newBook.summary || ""} onChange={(e) => setNewBook((s) => ({ ...s, summary: e.target.value }))} />
          <div className="mt-3 flex justify-end">
            <Button onClick={addCustomBook} disabled={!canAdd}>Add to Catalog</Button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            This catalog is stored only in your browser memory and resets on refresh. No upload.
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Featured Books</h2>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Info className="h-3.5 w-3.5" /> Click a card to add to pre‑order
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {catalog.map((book) => (
            <motion.div key={book.id} whileHover={{ y: -2 }}>
              <Card className="cursor-pointer group" onClick={() => addToCart(book)}>
                <CardHeader className="p-0">
                  <div className="relative">
                    <img src={book.image} alt={book.title} className="w-full h-48 object-cover rounded-t-2xl" />
                    {book.discountPct ? (
                      <Badge className="absolute top-3 left-3">-{book.discountPct}%</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-base leading-tight line-clamp-2">{book.title}</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">{book.author} • {book.genre}</p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3">{book.summary}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-semibold">{formatPHP(discounted(book))}</span>
                    {book.discountPct ? (
                      <>
                        <span className="text-xs line-through text-slate-400">{formatPHP(book.price)}</span>
                        <Badge variant="secondary" className="text-[10px]">Save {formatPHP(book.price - discounted(book))}</Badge>
                      </>
                    ) : null}
                  </div>
                  <Button className="mt-3 w-full opacity-0 group-hover:opacity-100 transition-opacity">Add to Pre‑Order</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Checkout / Notes */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Order Notes (printed only)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Pickup schedule, branch, or special requests.\n(These notes stay in your browser until you print.)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button onClick={printSlip} disabled={cart.length === 0}>
                  <Printer className="h-4 w-4 mr-2" /> Print / Save Pre‑Order PDF
                </Button>
                <Badge variant="outline" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Privacy by default
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                🔒 Privacy Notice: This form does not record or store any type of personal information. Everything stays on your device until you print or save a PDF.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cart.length === 0 ? (
                  <p className="text-sm text-slate-600">No items yet. Add books to generate a slip.</p>
                ) : (
                  <ul className="space-y-2">
                    {cart.map((item) => (
                      <li key={item.book.id} className="text-sm">
                        <div className="flex justify-between">
                          <span>
                            {item.qty}× {item.book.title}
                          </span>
                          <span>{formatPHP(item.qty * discounted(item.book))}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{item.book.author}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPHP(total)}</span>
                </div>
                {showContact && (
                  <div className="mt-4 text-xs text-slate-600 space-y-1">
                    <div><span className="font-medium">Name:</span> {name || "—"}</div>
                    <div><span className="font-medium">Email:</span> {email || "—"}</div>
                    <div><span className="font-medium">Phone:</span> {phone || "—"}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Print Styles */}
      <style>{`
        @media print {
          header, .print-hide { display: none !important; }
          body { background: white; }
          .card, .Card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      {/* Footer */}
      <footer className="border-t bg-white/60">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>We do not collect or transmit personal information. Use the Print button to generate your own slip.</span>
          </div>
          <div className="text-[11px]">© {new Date().getFullYear()} Feast Books (Demo)</div>
        </div>
      </footer>
    </div>
  );
}
