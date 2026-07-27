import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Dumbbell, Search, ChevronRight,ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useProductsStore } from '../../stores/productsStore';
import { roleHome } from '../../auth/accessPolicy';

export default function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isAuthenticated,user } = useAuthStore();
  const {getCartItemCount,migratePersistedCart}=useProductsStore();
  const cartCount=Math.max(0,getCartItemCount());
  useEffect(()=>{void migratePersistedCart();},[migratePersistedCart]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
    { to: '/exercises', label: 'Exercises' },
    { to: '/coaches', label: 'Coaches' },
    { to: '/videos', label: 'Videos' },
    { to: '/membership', label: 'Pricing' },
    { to: '/blog', label: 'Blog' },
    { to: '/about', label: 'About' },
    { to: '/seller/apply', label: 'Kênh người bán' },
  ];

  const isActive = (path: string) => path === '/products'
    ? location.pathname === '/products' || location.pathname.startsWith('/products/')
    : location.pathname === path;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#020617]/90 backdrop-blur-xl border-b border-[#1e293b]/50 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="premium-container">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center shadow-lg shadow-[#22C55E]/20 group-hover:shadow-[#22C55E]/40 transition-all duration-300 group-hover:scale-105">
              <Dumbbell size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">GYM<span className="text-[#22C55E]">ER</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`premium-nav-link ${isActive(link.to) ? 'premium-nav-link-active text-white' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/cart" aria-label={`Giỏ hàng, ${cartCount} sản phẩm`} className="premium-nav-link relative"><ShoppingCart size={20}/>{cartCount>0&&<span className="absolute -right-2 -top-2 rounded-full bg-orange-500 px-1.5 text-xs text-white">{cartCount}</span>}</Link>
            <Link to="/contact" className="premium-nav-link">
              <Search size={18} />
            </Link>
            {isAuthenticated ? (
              <Link to={user?roleHome(user.role):'/login'} className="hero-btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
                Dashboard <ChevronRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="premium-nav-link">
                  Log In
                </Link>
                <Link to="/register" className="hero-btn-primary text-sm px-6 py-2.5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 text-white hover:bg-[#1e293b] rounded-xl transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#020617]/95 backdrop-blur-xl border-t border-[#1e293b]/50"
          >
            <div className="premium-container py-6 space-y-2">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-[#22C55E]/10 text-[#22C55E]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1e293b]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-[#1e293b] space-y-2">
                <Link to="/cart" onClick={()=>setMobileOpen(false)} className="block px-4 py-3 text-[#94A3B8]">Cart ({cartCount})</Link>
                {user?.role==='member'&&<Link to="/orders" onClick={()=>setMobileOpen(false)} className="block px-4 py-3 text-[#94A3B8]">My orders</Link>}
                {isAuthenticated ? (
                  <Link to={user?roleHome(user.role):'/login'} onClick={() => setMobileOpen(false)} className="block hero-btn-primary text-center">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-[#94A3B8] hover:text-white rounded-xl transition-colors text-center">
                      Log In
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="block hero-btn-primary text-center">
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
