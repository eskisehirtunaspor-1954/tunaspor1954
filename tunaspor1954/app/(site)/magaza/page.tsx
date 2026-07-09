"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  category: "forma" | "atki" | "tisort";
  price: number;
  image_url?: string;
  sizes: string[];
  stock: number;
}

interface CartItem {
  productId: string;
  name: string;
  size?: string;
  quantity: number;
  unitPrice: number;
}

const CATEGORY_LABELS: Record<Product["category"], string> = {
  forma: "Formalar",
  atki: "Atkılar",
  tisort: "Tişörtler",
};

const CART_KEY = "tunaspor_magaza_sepet";

export default function MagazaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"hepsi" | Product["category"]>("hepsi");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: "", phone: "", email: "", address: "", payment_method: "havale" as "havale" | "kapida_odeme" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderDone, setOrderDone] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d.data ?? []));
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  function addToCart(p: Product, size?: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id && i.size === size);
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { productId: p.id, name: p.name, size, quantity: 1, unitPrice: p.price }];
    });
    setCartOpen(true);
  }

  function updateQty(index: number, delta: number) {
    setCart((prev) =>
      prev
        .map((i, idx) => (idx === index ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const filtered = activeCategory === "hepsi" ? products : products.filter((p) => p.category === activeCategory);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: cart }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error ?? "Sipariş oluşturulamadı.");
      return;
    }
    setOrderDone(true);
    setCart([]);
    localStorage.removeItem(CART_KEY);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-3">Tunaspor 1954</p>
          <h1 className="font-display text-4xl">Kulüp Mağazası</h1>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="relative bg-tuna-gold text-tuna-black font-semibold px-5 py-2.5 rounded-full"
        >
          🛒 Sepet {cart.length > 0 && `(${cart.reduce((s, i) => s + i.quantity, 0)})`}
        </button>
      </div>
      <p className="text-tuna-mist max-w-2xl mb-10">
        Ödeme havale/EFT veya kapıda ödeme ile alınır — siparişin sonrası WhatsApp'tan
        onay için seninle iletişime geçilir.
      </p>

      {/* Kategori filtresi */}
      <div className="flex gap-2 mb-10 flex-wrap">
        {(["hepsi", "forma", "atki", "tisort"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm border transition-all ${
              activeCategory === cat ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15 text-white/70"
            }`}
          >
            {cat === "hepsi" ? "Hepsi" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Ürün grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-20">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={addToCart} />
        ))}
        {!filtered.length && <p className="text-tuna-mist col-span-full">Bu kategoride henüz ürün eklenmedi.</p>}
      </div>

      {/* Sepet paneli */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-tuna-black border-l border-white/10 p-6 overflow-y-auto">
            {!checkoutOpen ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl">Sepetim</h2>
                  <button onClick={() => setCartOpen(false)} className="text-white/60 hover:text-white">✕</button>
                </div>
                <div className="space-y-3 mb-6">
                  {cart.map((item, idx) => (
                    <div key={idx} className="glass-panel p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        {item.size && <p className="text-xs text-tuna-mist">Beden: {item.size}</p>}
                        <p className="text-xs text-tuna-gold">{item.unitPrice}₺</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 border border-white/20 rounded">-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 border border-white/20 rounded">+</button>
                      </div>
                    </div>
                  ))}
                  {!cart.length && <p className="text-tuna-mist text-sm">Sepetin boş.</p>}
                </div>
                {cart.length > 0 && (
                  <>
                    <div className="flex justify-between font-display text-lg mb-4">
                      <span>Toplam</span>
                      <span className="text-tuna-gold">{total}₺</span>
                    </div>
                    <button
                      onClick={() => setCheckoutOpen(true)}
                      className="w-full bg-tuna-gold text-tuna-black font-semibold px-6 py-3 rounded-lg"
                    >
                      Siparişi Tamamla
                    </button>
                  </>
                )}
              </>
            ) : orderDone ? (
              <div className="text-center py-12">
                <p className="text-tuna-gold font-display text-xl mb-3">Siparişin alındı! 🎉</p>
                <p className="text-tuna-mist text-sm mb-6">
                  Ödeme ve kargo detayları için WhatsApp'tan seninle iletişime geçeceğiz.
                </p>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(false);
                    setOrderDone(false);
                  }}
                  className="bg-tuna-gold text-tuna-black font-semibold px-6 py-2 rounded-lg"
                >
                  Kapat
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl">Sipariş Bilgileri</h2>
                  <button type="button" onClick={() => setCheckoutOpen(false)} className="text-white/60 hover:text-white">✕</button>
                </div>
                <input required placeholder="Ad Soyad" value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
                <input required placeholder="Telefon" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
                <input type="email" placeholder="E-posta (opsiyonel)" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
                <textarea required placeholder="Teslimat Adresi" rows={3} value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold" />
                <div className="flex gap-2">
                  {(["havale", "kapida_odeme"] as const).map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setForm({ ...form, payment_method: pm })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                        form.payment_method === pm ? "border-tuna-gold text-tuna-gold bg-tuna-gold/10" : "border-white/15"
                      }`}
                    >
                      {pm === "havale" ? "Havale/EFT" : "Kapıda Ödeme"}
                    </button>
                  ))}
                </div>
                {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
                <div className="flex justify-between font-display text-lg pt-2">
                  <span>Toplam</span>
                  <span className="text-tuna-gold">{total}₺</span>
                </div>
                <button disabled={submitting} className="w-full bg-tuna-gold text-tuna-black font-semibold px-6 py-3 rounded-lg disabled:opacity-50">
                  {submitting ? "Gönderiliyor..." : "Siparişi Onayla"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product, size?: string) => void }) {
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0]);

  return (
    <div className="glass-panel overflow-hidden">
      <div className="aspect-square bg-white/5">
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <p className="font-medium mb-1">{product.name}</p>
        <p className="text-tuna-gold font-display text-lg mb-3">{product.price}₺</p>
        {product.sizes?.length > 0 && (
          <div className="flex gap-1 mb-3 flex-wrap">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`text-xs px-2 py-1 rounded border ${
                  selectedSize === s ? "border-tuna-gold text-tuna-gold" : "border-white/20 text-white/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => onAdd(product, selectedSize)}
          disabled={product.stock <= 0}
          className="w-full text-sm bg-tuna-gold/10 border border-tuna-gold/40 text-tuna-gold px-3 py-2 rounded-lg hover:bg-tuna-gold/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {product.stock > 0 ? "Sepete Ekle" : "Stokta Yok"}
        </button>
      </div>
    </div>
  );
}
