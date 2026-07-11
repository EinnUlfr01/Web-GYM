import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import CommandMenu from './components/layout/CommandMenu';
import MarketingHeader from './components/layout/MarketingHeader';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import CoachDashboard from './pages/coaches/CoachDashboard';
import CoachListPage from './pages/coaches/CoachListPage';
import CoachProfilePage from './pages/coaches/CoachProfilePage';
import MembersPage from './pages/members/MembersPage';
import ReferralPage from './pages/referral/ReferralPage';
import CouponPage from './pages/coupon/CouponPage';
import LoyaltyPage from './pages/loyalty/LoyaltyPage';
import AuditPage from './pages/audit/AuditPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import CRMPage from './pages/crm/CRMPage';
import TicketPage from './pages/tickets/TicketPage';
import InvoicePage from './pages/invoices/InvoicePage';
import BackupPage from './pages/backup/BackupPage';
import RevenuePage from './pages/revenue/RevenuePage';
import SettingsPage from './pages/settings/SettingsPage';
import MembershipPlans from './pages/membership/MembershipPlans';
import VideoLibrary from './pages/video/VideoLibrary';
import VideosPreviewPage from './pages/video/VideosPreviewPage';
import CoachBooking from './pages/booking/CoachBooking';
import UserProfile from './pages/profile/UserProfile';
import LandingPage from './pages/landing/LandingPage';
import AboutPage from './pages/about/AboutPage';
import ContactPage from './pages/contact/ContactPage';
import BlogPage from './pages/blog/BlogPage';
import SuccessStoriesPage from './pages/success-stories/SuccessStoriesPage';
import ExerciseLibraryPage from './pages/exercises/ExerciseLibraryPage';
import ExerciseDetail from './pages/exercises/ExerciseDetail';
import WorkoutPrograms from './pages/exercises/WorkoutPrograms';
import ProductsListPage from './pages/products/ProductsListPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><div className="text-white">Loading...</div></div>;
  return user.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <>
      <CommandMenu />
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<MarketingHeaderWrapper><LandingPage /></MarketingHeaderWrapper>} />
        <Route path="/about" element={<MarketingHeaderWrapper><AboutPage /></MarketingHeaderWrapper>} />
        <Route path="/contact" element={<MarketingHeaderWrapper><ContactPage /></MarketingHeaderWrapper>} />
        <Route path="/blog" element={<MarketingHeaderWrapper><BlogPage /></MarketingHeaderWrapper>} />
        <Route path="/membership" element={<MarketingHeaderWrapper><MembershipPlans /></MarketingHeaderWrapper>} />
        <Route path="/coaches" element={<MarketingHeaderWrapper><CoachListPage /></MarketingHeaderWrapper>} />
        <Route path="/coaches/:id" element={<MarketingHeaderWrapper><CoachProfilePage /></MarketingHeaderWrapper>} />
        <Route path="/videos" element={<MarketingHeaderWrapper><VideosPreviewPage /></MarketingHeaderWrapper>} />
        <Route path="/success-stories" element={<MarketingHeaderWrapper><SuccessStoriesPage /></MarketingHeaderWrapper>} />
        <Route path="/exercises" element={<MarketingHeaderWrapper><ExerciseLibraryPage /></MarketingHeaderWrapper>} />
        <Route path="/exercises/:id" element={<MarketingHeaderWrapper><ExerciseDetail /></MarketingHeaderWrapper>} />
        <Route path="/workout-programs" element={<MarketingHeaderWrapper><WorkoutPrograms /></MarketingHeaderWrapper>} />
        <Route path="/products" element={<MarketingHeaderWrapper><ProductsListPage /></MarketingHeaderWrapper>} />
        <Route path="/products/:id" element={<MarketingHeaderWrapper><ProductDetailPage /></MarketingHeaderWrapper>} />

        {/* AUTH */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* PROTECTED */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/coupons" element={<CouponPage />} />
          <Route path="/loyalty" element={<LoyaltyPage />} />
          <Route path="/tickets" element={<TicketPage />} />
          <Route path="/invoices" element={<InvoicePage />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/booking" element={<CoachBooking />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/video" element={<VideoLibrary />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
          <Route path="/admin/audit" element={<AdminRoute><AuditPage /></AdminRoute>} />
          <Route path="/admin/revenue" element={<AdminRoute><RevenuePage /></AdminRoute>} />
          <Route path="/admin/backup" element={<AdminRoute><BackupPage /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
          <Route path="/admin/inventory" element={<AdminRoute><AdminInventoryPage /></AdminRoute>} />
          <Route path="/coach" element={<CoachDashboard />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <MarketingHeaderWrapper>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold mb-4 text-white">404</h1>
                <p className="text-[#94A3B8] text-lg mb-8">Page not found</p>
                <a href="/" className="rounded-lg bg-[#2563eb] px-6 py-3 font-semibold text-white hover:bg-[#1d4ed8] transition-all inline-block">Back to Home</a>
              </div>
            </div>
          </MarketingHeaderWrapper>
        } />
      </Routes>
    </>
  );
}

function MarketingHeaderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <main className="pt-16">{children}</main>
    </>
  );
}
