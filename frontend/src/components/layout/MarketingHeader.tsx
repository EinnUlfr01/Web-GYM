import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Dumbbell,
  Home,
  Info,
  LayoutDashboard,
  Menu,
  Newspaper,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tags,
  User,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useProductsStore } from '../../stores/productsStore';
import { roleHome } from '../../auth/accessPolicy';

type NavigationMatch = 'exact' | 'prefix';
type DrawerOpenSource = 'button' | 'edge' | null;

interface NavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
  activeTo?: string;
  match?: NavigationMatch;
}

const explorationLinks: NavigationItem[] = [
  { to: '/', label: 'Home', icon: Home, match: 'exact' },
  { to: '/products', label: 'Shop', icon: ShoppingBag },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
  { to: '/coaches', label: 'Coaches', icon: Users },
  { to: '/videos', label: 'Videos', icon: Video },
  { to: '/membership', label: 'Pricing', icon: Tags },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/about', label: 'About', icon: Info },
];

export default function MarketingHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSource, setOpenSource] = useState<DrawerOpenSource>(null);
  const location = useLocation();
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const openTimerRef = useRef<number | undefined>(undefined);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const openSourceRef = useRef<DrawerOpenSource>(null);
  const drawerOpenRef = useRef(false);
  const edgePointerInsideRef = useRef(false);
  const drawerPointerInsideRef = useRef(false);
  const { isAuthenticated, user } = useAuthStore();
  const { getCartItemCount, migratePersistedCart } = useProductsStore();
  const cartCount = Math.max(0, getCartItemCount());

  useEffect(() => {
    void migratePersistedCart();
  }, [migratePersistedCart]);

  const dashboardRoute = isAuthenticated && user ? roleHome(user.role) : '/dashboard';
  const accountLinks: NavigationItem[] = [
    { to: '/seller/apply', label: 'Kênh người bán', icon: Store, match: 'exact' },
    {
      to: dashboardRoute,
      activeTo: isAuthenticated && user ? dashboardRoute : '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      match: 'exact',
    },
  ];

  const isActive = (item: NavigationItem) => {
    const path = item.activeTo || item.to;
    if (item.match === 'exact' || path === '/') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const clearDrawerTimers = () => {
    if (openTimerRef.current !== undefined) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = undefined;
    }
    if (closeTimerRef.current !== undefined) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }
  };

  const closeDrawer = ({ restoreFocus = true }: { restoreFocus?: boolean } = {}) => {
    clearDrawerTimers();
    openSourceRef.current = null;
    drawerOpenRef.current = false;
    edgePointerInsideRef.current = false;
    drawerPointerInsideRef.current = false;
    setOpenSource(null);
    setDrawerOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const openDrawer = (source: Exclude<DrawerOpenSource, null>) => {
    clearDrawerTimers();
    openSourceRef.current = source;
    drawerOpenRef.current = true;
    setOpenSource(source);
    setDrawerOpen(true);
  };

  const canUseEdgeHover = () => (
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && window.matchMedia('(min-width: 1024px)').matches
  );

  const scheduleEdgeClose = () => {
    clearTimeoutIfPresent('close');
    if (
      openSourceRef.current !== 'edge'
      || edgePointerInsideRef.current
      || drawerPointerInsideRef.current
    ) return;
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = undefined;
      if (
        openSourceRef.current === 'edge'
        && !edgePointerInsideRef.current
        && !drawerPointerInsideRef.current
      ) closeDrawer({ restoreFocus: false });
    }, 320);
  };

  const clearTimeoutIfPresent = (timer: 'open' | 'close') => {
    const timerRef = timer === 'open' ? openTimerRef : closeTimerRef;
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const handleEdgeEnter = () => {
    if (!canUseEdgeHover()) return;
    edgePointerInsideRef.current = true;
    clearDrawerTimers();
    if (drawerOpenRef.current) return;
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = undefined;
      if (edgePointerInsideRef.current && canUseEdgeHover() && !drawerOpenRef.current) {
        openDrawer('edge');
      }
    }, 210);
  };

  const handleEdgeLeave = () => {
    edgePointerInsideRef.current = false;
    clearTimeoutIfPresent('open');
    scheduleEdgeClose();
  };

  const handleDrawerEnter = () => {
    drawerPointerInsideRef.current = true;
    clearTimeoutIfPresent('close');
  };

  const handleDrawerLeave = () => {
    drawerPointerInsideRef.current = false;
    scheduleEdgeClose();
  };

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusableSelector = 'button:not([disabled]), a[href]:not([tabindex="-1"])';
    const focusFirst = () => drawerRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    if (openSource === 'button') requestAnimationFrame(focusFirst);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        .filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen, openSource]);

  useEffect(() => {
    clearDrawerTimers();
    if (drawerOpenRef.current) closeDrawer({ restoreFocus: false });
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => () => clearDrawerTimers(), []);

  const renderItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <Link
        key={`${item.label}-${item.to}`}
        to={item.to}
        tabIndex={drawerOpen ? 0 : -1}
        onClick={() => closeDrawer()}
        className={`marketing-drawer-link ${active ? 'is-active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={19} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <header className="marketing-header fixed inset-x-0 top-0 z-50">
        <div className="premium-container">
          <div className="flex h-16 items-center justify-between gap-3 md:h-20">
            <div className="flex min-w-0 items-center gap-2">
              <button
                ref={menuButtonRef}
                type="button"
                className="marketing-menu-button inline-flex shrink-0 items-center justify-center"
                onClick={() => (drawerOpen ? closeDrawer() : openDrawer('button'))}
                aria-label={drawerOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
                aria-expanded={drawerOpen}
                aria-controls="public-navigation-drawer"
              >
                {drawerOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
              </button>
              <Link to="/" onClick={drawerOpen ? () => closeDrawer() : undefined} className="marketing-header-brand group flex items-center gap-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-lime-500 text-slate-950 shadow-lg shadow-lime-400/20 transition-transform group-hover:scale-105">
                  <Dumbbell size={21} aria-hidden="true" />
                </span>
                <span className="truncate text-lg font-bold tracking-tight sm:text-xl">GYM<span className="text-lime-300">ER</span></span>
              </Link>
            </div>

            <div className="marketing-header-utilities">
              <Link
                to="/cart"
                className="marketing-utility-button relative"
                aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
              >
                <ShoppingCart size={20} aria-hidden="true" />
                {cartCount > 0 && <span className="marketing-cart-count">{cartCount}</span>}
              </Link>
              {isAuthenticated ? (
                <Link to={dashboardRoute} className="marketing-utility-button" aria-label="Mở Dashboard">
                  <User size={20} aria-hidden="true" />
                </Link>
              ) : (
                <Link to="/login" className="marketing-utility-button" aria-label="Đăng nhập">
                  <User size={20} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        className="marketing-drawer-edge-trigger"
        aria-hidden="true"
        onMouseEnter={handleEdgeEnter}
        onMouseLeave={handleEdgeLeave}
      />
      {drawerOpen && <div className="marketing-drawer-backdrop" aria-hidden="true" onClick={() => closeDrawer()} />}
      <aside
        ref={drawerRef}
        id="public-navigation-drawer"
        className={`marketing-drawer ${drawerOpen ? 'is-open' : ''}`}
        aria-label="Menu điều hướng công khai"
        aria-hidden={!drawerOpen}
        aria-modal={drawerOpen ? true : undefined}
        role="dialog"
        onMouseEnter={handleDrawerEnter}
        onMouseLeave={handleDrawerLeave}
      >
        <div className="marketing-drawer-header">
          <Link to="/" tabIndex={drawerOpen ? 0 : -1} onClick={() => closeDrawer()} className="sidebar-brand-link">
            <span className="brand-mark">G</span>
            <span>
              <strong className="block text-sm tracking-[.08em]">GYMER</strong>
              <span className="marketing-drawer-kicker">Train with intent</span>
            </span>
          </Link>
          <button
            type="button"
            tabIndex={drawerOpen ? 0 : -1}
            className="marketing-drawer-close marketing-utility-button"
            onClick={() => closeDrawer()}
            aria-label="Đóng menu điều hướng"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="marketing-drawer-body">
          <nav className="marketing-drawer-group" aria-label="Khám phá">
            <span className="marketing-drawer-label">Khám phá</span>
            {explorationLinks.map(renderItem)}
          </nav>
          <nav className="marketing-drawer-group marketing-drawer-footer" aria-label="Tài khoản">
            <span className="marketing-drawer-label">Tài khoản</span>
            {accountLinks.map(renderItem)}
          </nav>
        </div>
      </aside>
    </>
  );
}
