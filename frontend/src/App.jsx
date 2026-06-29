import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { ShoppingCart, Sparkles, Send, Plus, Minus, Search, PackageX, Zap, Tag, ChevronRight } from 'lucide-react';
import './App.css';

const BACKEND_URL = 'http://localhost:3002/api';

// ─── OFFERS ─────────────────────────────────────────────────────────────────
// offer types: 'percent' | 'flat' | 'bogo'
const OFFERS = {
  3:  { label: '20% OFF', type: 'percent', value: 20, badge: '🔥 Hot Deal' },
  6:  { label: 'Buy 2 Get 1', type: 'bogo',    value: 1,  badge: '🎁 BOGO' },
  7:  { label: '15% OFF', type: 'percent', value: 15, badge: '☕ Chai Deal' },
  9:  { label: '₹30 OFF',  type: 'flat',    value: 30, badge: '🌾 Save More' },
  12: { label: '10% OFF', type: 'percent', value: 10, badge: '💛 Dal Deal' },
  22: { label: '₹5 OFF',  type: 'flat',    value: 5,  badge: '🍬 Sweet Deal' },
  24: { label: '20% OFF', type: 'percent', value: 20, badge: '🧅 Fresh Pick' },
  28: { label: '₹50 OFF', type: 'flat',    value: 50, badge: '🪔 Ghee Fest' },
  29: { label: '2 for ₹180', type: 'combo', value: 180, badge: '🥨 Snack Pack' },
  4:  { label: '10% OFF', type: 'percent', value: 10, badge: '🧈 Dairy Deal' },
};

function getDiscountedPrice(item) {
  const offer = OFFERS[item.id];
  if (!offer) return item.price;
  if (offer.type === 'percent') return Math.round(item.price * (1 - offer.value / 100));
  if (offer.type === 'flat')    return Math.max(0, item.price - offer.value);
  if (offer.type === 'bogo')    return item.price; // handled at qty logic
  if (offer.type === 'combo')   return item.price; // shown as label
  return item.price;
}

// ─── EXPANDED CATALOG ────────────────────────────────────────────────────────
const CATALOG = [
  // ── Staples & Grains ──
  { id: 1,  cat: 'staples',   item: 'Aashirvaad Whole Wheat Atta', unit: '5kg',   price: 230, img: 'https://images.openfoodfacts.org/images/products/890/172/512/1129/front_en.3.400.jpg', emoji: '🌾' },
  { id: 2,  cat: 'staples',   item: 'Tata Salt',                    unit: '1kg',   price: 28,  img: 'https://images.openfoodfacts.org/images/products/890/105/700/1404/front_en.3.400.jpg', emoji: '🧂' },
  { id: 9,  cat: 'staples',   item: 'Daawat Rozana Basmati Rice',   unit: '5kg',   price: 380, img: 'https://images.openfoodfacts.org/images/products/890/153/700/7116/front_en.3.400.jpg', emoji: '🍚' },
  { id: 12, cat: 'staples',   item: 'Toor Dal (Unpolished)',        unit: '1kg',   price: 165, img: null, emoji: '🫘' },
  { id: 13, cat: 'staples',   item: 'Moong Dal',                    unit: '1kg',   price: 130, img: null, emoji: '🟢' },
  { id: 14, cat: 'staples',   item: 'Chana Dal',                    unit: '1kg',   price: 95,  img: null, emoji: '🟤' },
  { id: 22, cat: 'staples',   item: 'Sugar (Premium)',              unit: '1kg',   price: 45,  img: null, emoji: '🍬' },
  { id: 23, cat: 'staples',   item: 'Jaggery (Gud)',                unit: '1kg',   price: 70,  img: null, emoji: '🟫' },
  { id: 31, cat: 'staples',   item: 'Rajma (Red Kidney Beans)',     unit: '1kg',   price: 145, img: null, emoji: '🫘' },
  { id: 32, cat: 'staples',   item: 'Poha (Flattened Rice)',        unit: '1kg',   price: 65,  img: null, emoji: '🌾' },

  // ── Dairy & Eggs ──
  { id: 4,  cat: 'dairy',     item: 'Amul Butter',                  unit: '100g',  price: 58,  img: 'https://images.openfoodfacts.org/images/products/890/126/201/0016/front_en.3.400.jpg', emoji: '🧈' },
  { id: 17, cat: 'dairy',     item: 'Amul Taaza Toned Milk',        unit: '1L',    price: 72,  img: 'https://images.openfoodfacts.org/images/products/890/126/226/0091/front_en.3.400.jpg', emoji: '🥛' },
  { id: 27, cat: 'dairy',     item: 'Amul Cheese Slices',           unit: '200g',  price: 135, img: 'https://images.openfoodfacts.org/images/products/890/126/202/0015/front_en.3.400.jpg', emoji: '🧀' },
  { id: 28, cat: 'dairy',     item: 'Patanjali Cow Ghee',           unit: '1L',    price: 630, img: null, emoji: '🪔' },
  { id: 30, cat: 'dairy',     item: 'Gowardhan Paneer',             unit: '200g',  price: 95,  img: null, emoji: '🧊' },
  { id: 33, cat: 'dairy',     item: 'Nestle Slim Curd',             unit: '400g',  price: 55,  img: null, emoji: '🥛' },
  { id: 34, cat: 'dairy',     item: 'Mother Dairy Mishti Doi',      unit: '200g',  price: 45,  img: null, emoji: '🍮' },
  { id: 35, cat: 'dairy',     item: 'Amul Lassi',                   unit: '200ml', price: 30,  img: null, emoji: '🥤' },

  // ── Spices & Masalas ──
  { id: 10, cat: 'spices',    item: 'Everest Turmeric Powder',      unit: '100g',  price: 32,  img: null, emoji: '🟡' },
  { id: 11, cat: 'spices',    item: 'MDH Garam Masala',             unit: '100g',  price: 82,  img: null, emoji: '🌶️' },
  { id: 36, cat: 'spices',    item: 'Everest Red Chilli Powder',    unit: '100g',  price: 55,  img: null, emoji: '🌶️' },
  { id: 37, cat: 'spices',    item: 'MDH Kitchen King Masala',      unit: '100g',  price: 76,  img: null, emoji: '👑' },
  { id: 38, cat: 'spices',    item: 'Saffola Aromatic Cumin Seeds', unit: '100g',  price: 38,  img: null, emoji: '🌿' },
  { id: 39, cat: 'spices',    item: 'Catch Black Pepper Powder',    unit: '50g',   price: 45,  img: null, emoji: '⚫' },
  { id: 40, cat: 'spices',    item: 'Tata Sampann Chana Masala',    unit: '100g',  price: 62,  img: null, emoji: '🌶️' },

  // ── Oils & Ghee ──
  { id: 8,  cat: 'oils',      item: 'Fortune Sunlite Refined Oil',  unit: '1L',    price: 145, img: 'https://images.openfoodfacts.org/images/products/890/600/728/0280/front_en.3.400.jpg', emoji: '🫙' },
  { id: 41, cat: 'oils',      item: 'Saffola Gold Oil',             unit: '1L',    price: 185, img: null, emoji: '💛' },
  { id: 42, cat: 'oils',      item: 'Dabur Mustard Oil',            unit: '1L',    price: 155, img: null, emoji: '🟡' },
  { id: 43, cat: 'oils',      item: 'KLF Coconad Coconut Oil',      unit: '500ml', price: 120, img: null, emoji: '🥥' },

  // ── Beverages ──
  { id: 7,  cat: 'beverages', item: 'Brooke Bond Red Label Tea',    unit: '500g',  price: 270, img: 'https://images.openfoodfacts.org/images/products/890/103/087/6998/front_en.3.400.jpg', emoji: '🍵' },
  { id: 16, cat: 'beverages', item: 'Nescafe Classic Coffee',       unit: '50g',   price: 170, img: 'https://images.openfoodfacts.org/images/products/890/105/800/4700/front_en.3.400.jpg', emoji: '☕' },
  { id: 44, cat: 'beverages', item: 'Bournvita Health Drink',       unit: '500g',  price: 295, img: null, emoji: '🍫' },
  { id: 45, cat: 'beverages', item: 'Horlicks Original Malt',       unit: '500g',  price: 285, img: null, emoji: '🥛' },
  { id: 46, cat: 'beverages', item: 'Lipton Green Tea',             unit: '25 bags', price: 125, img: null, emoji: '🍃' },
  { id: 47, cat: 'beverages', item: 'Real Fruit Juice (Mixed)',     unit: '1L',    price: 110, img: null, emoji: '🧃' },

  // ── Instant & Packaged ──
  { id: 3,  cat: 'instant',   item: 'Maggi 2-Minute Noodles',       unit: '70g',   price: 14,  img: 'https://images.openfoodfacts.org/images/products/890/105/885/1311/front_en.3.400.jpg', emoji: '🍜' },
  { id: 48, cat: 'instant',   item: 'Maggi Masala Noodles (Pack of 6)', unit: '420g', price: 78, img: null, emoji: '🍜' },
  { id: 49, cat: 'instant',   item: 'Knorr Tomato Soup',            unit: '45g',   price: 35,  img: null, emoji: '🍲' },
  { id: 50, cat: 'instant',   item: 'MTR Poha Instant Mix',         unit: '200g',  price: 55,  img: null, emoji: '🌾' },
  { id: 51, cat: 'instant',   item: 'Haldiram Dal Makhani (Ready)', unit: '300g',  price: 89,  img: null, emoji: '🫘' },

  // ── Snacks & Biscuits ──
  { id: 6,  cat: 'snacks',    item: 'Parle-G Gold Biscuits',        unit: '1kg',   price: 90,  img: 'https://images.openfoodfacts.org/images/products/890/171/912/3948/front_en.3.400.jpg', emoji: '🍪' },
  { id: 15, cat: 'snacks',    item: 'Britannia Good Day Cashew',    unit: '600g',  price: 120, img: null, emoji: '🍪' },
  { id: 29, cat: 'snacks',    item: "Haldiram's Bhujia Sev",        unit: '400g',  price: 105, img: 'https://images.openfoodfacts.org/images/products/890/400/440/0076/front_en.3.400.jpg', emoji: '🥨' },
  { id: 52, cat: 'snacks',    item: 'Lay\'s Classic Salted Chips',  unit: '50g',   price: 20,  img: null, emoji: '🥔' },
  { id: 53, cat: 'snacks',    item: 'Kurkure Masala Munch',         unit: '90g',   price: 20,  img: null, emoji: '🌽' },
  { id: 54, cat: 'snacks',    item: 'Britannia NutriChoice 5 Grain',unit: '400g',  price: 85,  img: null, emoji: '🌾' },
  { id: 55, cat: 'snacks',    item: 'Tide Boondi Namkeen',          unit: '200g',  price: 45,  img: null, emoji: '🥨' },

  // ── Fresh Vegetables ──
  { id: 24, cat: 'veggies',   item: 'Onion',                        unit: '1kg',   price: 30,  img: null, emoji: '🧅' },
  { id: 25, cat: 'veggies',   item: 'Potato',                       unit: '1kg',   price: 25,  img: null, emoji: '🥔' },
  { id: 26, cat: 'veggies',   item: 'Tomato',                       unit: '1kg',   price: 40,  img: null, emoji: '🍅' },
  { id: 56, cat: 'veggies',   item: 'Ginger Fresh',                 unit: '250g',  price: 30,  img: null, emoji: '🫚' },
  { id: 57, cat: 'veggies',   item: 'Garlic',                       unit: '250g',  price: 35,  img: null, emoji: '🧄' },
  { id: 58, cat: 'veggies',   item: 'Green Chilli',                 unit: '250g',  price: 20,  img: null, emoji: '🌿' },
  { id: 59, cat: 'veggies',   item: 'Lemon',                        unit: '6 pcs', price: 25,  img: null, emoji: '🍋' },
  { id: 60, cat: 'veggies',   item: 'Capsicum (Green)',             unit: '500g',  price: 45,  img: null, emoji: '🫑' },

  // ── Home & Personal Care ──
  { id: 5,  cat: 'homecare',  item: 'Surf Excel Easy Wash',         unit: '1kg',   price: 135, img: null, emoji: '🫧' },
  { id: 18, cat: 'homecare',  item: 'Dettol Antiseptic Liquid',     unit: '250ml', price: 125, img: 'https://images.openfoodfacts.org/images/products/890/139/635/3003/front_en.3.400.jpg', emoji: '🧴' },
  { id: 19, cat: 'homecare',  item: 'Vim Dishwash Gel',             unit: '250ml', price: 55,  img: null, emoji: '🍶' },
  { id: 20, cat: 'homecare',  item: 'Colgate Strong Teeth',         unit: '200g',  price: 110, img: 'https://images.openfoodfacts.org/images/products/890/131/472/5936/front_en.3.400.jpg', emoji: '🦷' },
  { id: 21, cat: 'homecare',  item: 'Pears Pure & Gentle Soap',     unit: '125g',  price: 52,  img: null, emoji: '🧼' },
  { id: 61, cat: 'homecare',  item: 'Harpic Toilet Cleaner',        unit: '500ml', price: 95,  img: null, emoji: '🚽' },
  { id: 62, cat: 'homecare',  item: 'Odonil Room Freshener',        unit: '48g',   price: 55,  img: null, emoji: '🌸' },
  { id: 63, cat: 'homecare',  item: 'Scotch-Brite Scrub Pad',       unit: '3 pcs', price: 45,  img: null, emoji: '🧽' },
];

const CATEGORIES = [
  { id: 'staples',   label: 'Staples & Grains',   icon: '🌾', color: '#f0fdf4', border: '#86efac', img: '/categories/staples.png' },
  { id: 'dairy',     label: 'Dairy & Eggs',        icon: '🥛', color: '#fffbeb', border: '#fde68a', img: '/categories/dairy.png'   },
  { id: 'spices',    label: 'Spices & Masalas',    icon: '🌶️', color: '#fff7ed', border: '#fdba74', img: '/categories/spices.png'  },
  { id: 'oils',      label: 'Oils & Ghee',         icon: '🫙', color: '#fefce8', border: '#fef08a', img: '/categories/oils.png'    },
  { id: 'beverages', label: 'Beverages',            icon: '☕', color: '#fdf2f8', border: '#f0abfc', img: '/categories/beverages.png'},
  { id: 'instant',   label: 'Instant & Packaged',  icon: '🍜', color: '#fff1f2', border: '#fda4af', img: null },
  { id: 'snacks',    label: 'Snacks & Biscuits',   icon: '🍪', color: '#fffbeb', border: '#fcd34d', img: '/categories/snacks.png'  },
  { id: 'veggies',   label: 'Fresh Vegetables',    icon: '🥦', color: '#f0fdf4', border: '#4ade80', img: '/categories/veggies.png' },
  { id: 'homecare',  label: 'Home & Personal Care',icon: '🧴', color: '#eff6ff', border: '#93c5fd', img: '/categories/homecare.png'},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getDiscounted(item) {
  const offer = OFFERS[item.id];
  if (!offer) return item.price;
  if (offer.type === 'percent') return Math.round(item.price * (1 - offer.value / 100));
  if (offer.type === 'flat')    return Math.max(0, item.price - offer.value);
  return item.price;
}

function ImgOrEmoji({ item, className }) {
  const [failed, setFailed] = useState(false);
  if (item.img && !failed) {
    return (
      <img
        src={item.img}
        alt={item.item}
        className={className}
        onError={() => setFailed(true)}
        style={{ objectFit: 'contain', width: '100%', height: '100%', padding: '6px' }}
      />
    );
  }
  return <span style={{ fontSize: '2.4rem' }}>{item.emoji}</span>;
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [messyList, setMessyList]   = useState('');
  const [cartItems, setCartItems]   = useState([]);
  const [missing, setMissing]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [phone, setPhone]           = useState('');
  const [checkoutStatus, setCS]     = useState('');
  const [searchQuery, setSQ]        = useState('');
  const [activeCategory, setAC]     = useState('all');
  const [pillAnim, setPillAnim]     = useState(false);

  const cartTotal = cartItems.reduce((s, i) => s + i.effectivePrice * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const filteredItems = useMemo(() => {
    let items = activeCategory === 'all' ? CATALOG : CATALOG.filter(c => c.cat === activeCategory);
    if (searchQuery) items = items.filter(c => c.item.toLowerCase().includes(searchQuery.toLowerCase()));
    return items;
  }, [activeCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    if (activeCategory !== 'all' || searchQuery) return null;
    const groups = {};
    CATALOG.forEach(item => {
      if (!groups[item.cat]) groups[item.cat] = [];
      groups[item.cat].push(item);
    });
    return groups;
  }, [activeCategory, searchQuery]);

  const getCartQty  = id => cartItems.find(i => i.id === id)?.qty ?? 0;

  const mergeCart = (toAdd) => {
    setCartItems(prev => {
      const next = [...prev];
      toAdd.forEach(pItem => {
        const cat   = CATALOG.find(c => c.id === pItem.id);
        const price = cat?.price ?? (pItem.totalPrice / pItem.qty || 0);
        const ep    = getDiscounted({ id: pItem.id, price });
        const idx   = next.findIndex(i => i.id === pItem.id);
        if (idx >= 0) {
          next[idx] = { ...next[idx], qty: next[idx].qty + pItem.qty, effectivePrice: ep };
        } else {
          next.push({ ...pItem, price, effectivePrice: ep, emoji: cat?.emoji ?? '🛒', img: cat?.img ?? null });
        }
      });
      return next;
    });
    setPillAnim(true); setTimeout(() => setPillAnim(false), 400);
  };

  const updateQty = (id, d) => {
    setCartItems(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const nq = i.qty + d;
        return nq <= 0 ? null : { ...i, qty: nq };
      }).filter(Boolean)
    );
  };

  const addFromCatalog = (cat) => {
    const ep = getDiscounted(cat);
    mergeCart([{ id: cat.id, item: cat.item, qty: 1, totalPrice: ep }]);
  };

  const handleMagicCart = async () => {
    if (!messyList.trim()) return;
    setLoading(true); setMissing([]);
    try {
      const { data } = await axios.post(`${BACKEND_URL}/parse-list`, { text: messyList });
      mergeCart(data.cartItems ?? []);
      setMissing(data.missingItems ?? []);
      setMessyList('');
    } catch (err) {
      alert(`Error: ${err?.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  const handleCheckout = async () => {
    if (!phone.trim()) { alert('Enter your WhatsApp number'); return; }
    if (!cartItems.length) { alert('Cart is empty!'); return; }
    setCS('sending');
    try {
      await axios.post(`${BACKEND_URL}/send-whatsapp`, { phone, cartItems, total: cartTotal });
      setCS('success');
      setTimeout(() => { setCS(''); setCartItems([]); setMissing([]); }, 3500);
    } catch (err) {
      setCS('error'); setTimeout(() => setCS(''), 3000);
    }
  };

  const btnLabel = () => {
    if (checkoutStatus === 'sending') return <><div className="spinner" /> Sending…</>;
    if (checkoutStatus === 'success') return <>✅ Bill Sent!</>;
    if (checkoutStatus === 'error')   return <>❌ Failed — Retry</>;
    return <><Send size={16} /> Generate Bill & Send</>;
  };
  const btnCls = () => {
    if (checkoutStatus === 'success') return 'checkout-btn checkout-btn-success';
    if (checkoutStatus === 'error')   return 'checkout-btn checkout-btn-error';
    return 'checkout-btn checkout-btn-default';
  };

  // ── render a grid of item cards ──
  const renderGrid = (items) => (
    <div className="catalog-grid">
      {items.map((item, idx) => {
        const qty    = getCartQty(item.id);
        const offer  = OFFERS[item.id];
        const ep     = getDiscounted(item);
        const saving = item.price - ep;
        return (
          <div
            key={item.id}
            className={`item-card ${qty > 0 ? 'item-card-in-cart' : ''}`}
            style={{ animationDelay: `${Math.min(idx * 0.035, 0.5)}s` }}
          >
            {/* Offer badge */}
            {offer && (
              <div className="offer-badge">
                <Tag size={9} /> {offer.label}
              </div>
            )}

            {/* Image */}
            <div className="item-img-wrap">
              <ImgOrEmoji item={item} />
            </div>

            <p className="item-name" title={item.item}>{item.item}</p>
            <p className="item-unit">{item.unit}</p>

            <div className="item-footer">
              <div className="item-price-col">
                <span className="item-price">₹{ep}</span>
                {saving > 0 && <span className="item-mrp">₹{item.price}</span>}
              </div>

              {qty > 0 ? (
                <div className="qty-stepper">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={12} /></button>
                  <span className="qty-num">{qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={12} /></button>
                </div>
              ) : (
                <button className="add-btn" onClick={() => addFromCatalog(item)}>
                  <span>ADD</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* ═══ HEADER ═══ */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">🛒</div>
            <div className="logo-text-wrap">
              <span className="logo-text">Smart Kirana</span>
              <span className="logo-sub">AI-Powered Grocery</span>
            </div>
          </div>
          <div className="header-right">
            <div className="delivery-badge"><Zap size={13} /> Delivery in 10 mins</div>
            {cartCount > 0 && (
              <button className={`cart-pill ${pillAnim ? 'cart-pill-animate' : ''}`}>
                <ShoppingCart size={15} />
                {cartCount} items · ₹{cartTotal}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="page">
        {/* ── LEFT ── */}
        <div className="left-col">

          {/* HERO */}
          <section className="hero">
            <div className="hero-chip"><Sparkles size={13} /> AI Magic Cart</div>
            <h2>Drop your messy list here ✍️</h2>
            <p>Hinglish, shortcuts, typos — our AI handles it all. Just type freely!</p>
            <div className="textarea-wrap">
              <textarea
                className="magic-textarea"
                rows={4}
                placeholder="e.g. 2 packet maggi, adha kg cheeni, surf excel, thoda paneer aur amul butter..."
                value={messyList}
                onChange={e => setMessyList(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleMagicCart(); }}
              />
              <button className="magic-btn" onClick={handleMagicCart} disabled={loading || !messyList.trim()}>
                {loading ? <><div className="spinner" /> Parsing…</> : <><Sparkles size={16} /> Magic Cart ✨</>}
              </button>
            </div>
            <p className="hint">💡 Tip: Press Ctrl + Enter to submit</p>
          </section>

          {/* CATEGORY PILLS */}
          <div className="cat-pill-row">
            <button className={`cat-pill-btn ${activeCategory === 'all' ? 'cat-pill-active' : ''}`} onClick={() => setAC('all')}>
              🛒 All
            </button>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`cat-pill-btn ${activeCategory === c.id ? 'cat-pill-active' : ''}`} onClick={() => setAC(c.id)}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* SEARCH */}
          <div className="catalog-header">
            <h2>{activeCategory === 'all' ? <>Our <span>Catalog</span></> : CATEGORIES.find(c => c.id === activeCategory)?.label}</h2>
            <div className="search-wrap">
              <span className="search-icon"><Search size={15} /></span>
              <input className="search-input" type="text" placeholder="Search items…" value={searchQuery} onChange={e => setSQ(e.target.value)} />
            </div>
          </div>

          {/* CATALOG — grouped or flat */}
          {groupedItems ? (
            CATEGORIES.map(cat => {
              const items = groupedItems[cat.id];
              if (!items?.length) return null;
              return (
                <section key={cat.id} className="catalog-section">
                  <div className="section-header" style={{ background: cat.color, borderColor: cat.border }}>
                    {cat.img ? (
                      <img src={cat.img} alt={cat.label} className="section-header-img" onError={e => e.target.style.display='none'} />
                    ) : (
                      <span className="section-header-emoji">{cat.icon}</span>
                    )}
                    <div>
                      <h3 className="section-title">{cat.icon} {cat.label}</h3>
                      <p className="section-sub">{items.length} items</p>
                    </div>
                    <button className="section-see-all" onClick={() => setAC(cat.id)}>
                      See all <ChevronRight size={14} />
                    </button>
                  </div>
                  {renderGrid(items)}
                </section>
              );
            })
          ) : (
            renderGrid(filteredItems)
          )}

        </div>

        {/* ── RIGHT ── */}
        <div className="right-col">
          {/* CART */}
          <div className="cart-panel">
            <div className="cart-title">
              <div className="cart-title-icon"><ShoppingCart size={17} /></div>
              Your Cart {cartCount > 0 && <span style={{ color: '#16a34a' }}>({cartCount})</span>}
            </div>

            {!cartItems.length ? (
              <div className="cart-empty">
                <span className="cart-empty-emoji">🛒</span>
                <p>Cart is empty</p>
                <small>Use Magic Cart or tap ADD on any item</small>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-emoji">
                        {item.img ? (
                          <img src={item.img} alt={item.item} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
                        ) : item.emoji ?? '🛒'}
                      </div>
                      <div className="cart-item-info">
                        <p className="cart-item-name" title={item.item}>{item.item}</p>
                        <p className="cart-item-price">₹{item.effectivePrice} each</p>
                      </div>
                      <div className="cart-stepper">
                        <button className="cart-qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={11} /></button>
                        <span className="cart-qty-num">{item.qty}</span>
                        <button className="cart-qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={11} /></button>
                      </div>
                      <span className="cart-item-total">₹{item.effectivePrice * item.qty}</span>
                    </div>
                  ))}
                </div>
                <hr className="cart-divider" />
                <div className="cart-total-row">
                  <span className="cart-total-label">Total to pay</span>
                  <span className="cart-total-amount">₹{cartTotal}</span>
                </div>
                <input type="tel" className="phone-input" placeholder="+91 WhatsApp number" value={phone} onChange={e => setPhone(e.target.value)} />
                <button className={btnCls()} onClick={handleCheckout} disabled={checkoutStatus === 'sending'}>{btnLabel()}</button>
              </>
            )}
          </div>

          {/* OOPS */}
          {missing.length > 0 && (
            <div className="oops-panel">
              <div className="oops-title">
                <div className="oops-title-icon"><PackageX size={16} color="#c2410c" /></div>
                Oops! Not in stock
              </div>
              <div className="oops-items">
                {missing.map((item, i) => (
                  <div key={i} className="oops-item" style={{ animationDelay: `${i * 0.07}s` }}>
                    <p className="oops-item-name">{item.item || item.name}</p>
                    <p className="oops-item-msg">"{item.funnyMessage}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
