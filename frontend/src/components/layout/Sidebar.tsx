import { BarChart3, Boxes, Calendar, CalendarClock, ChevronDown, ClipboardList, Dumbbell, FileText, Gift, LayoutDashboard, LineChart, LogOut, Package, Settings, Shield, ShoppingCart, Star, Store, Ticket, Users, UserCheck, Wallet, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { canAccess } from "../../auth/accessPolicy";
import type { Role } from "../../auth/accessPolicy";
import { useAuthStore } from "../../stores/authStore";

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard }
const common: NavItem[] = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/booking", label: "Lịch tập", icon: Calendar },
  { to: "/tickets", label: "Hỗ trợ", icon: Ticket },
  { to: "/settings", label: "Cài đặt", icon: Settings },
];
const member: NavItem[] = [
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/reviews", label: "Đánh giá của tôi", icon: Star },
  { to: "/orders", label: "Đơn hàng của tôi", icon: ShoppingCart },
  { to: "/complaints", label: "Khiếu nại sản phẩm", icon: Ticket },
  { to: "/seller/apply", label: "Kênh người bán", icon: Store },
  { to: "/loyalty", label: "Loyalty", icon: Star },
  { to: "/referral", label: "Giới thiệu", icon: Gift },
];
const coach: NavItem[] = [
  { to: "/coach", label: "Coach Dashboard", icon: LayoutDashboard },
  { to: "/coach/exercises", label: "Exercise Library", icon: Dumbbell },
  { to: "/coach/workout-programs", label: "My Programs", icon: ClipboardList },
  { to: "/coach/members", label: "My Members", icon: Users },
  { to: "/coach/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/coach/schedules", label: "Schedules", icon: CalendarClock },
  { to: "/reviews", label: "Đánh giá của tôi", icon: Star },
  { to: "/orders", label: "Đơn hàng của tôi", icon: ShoppingCart },
  { to: "/complaints", label: "Khiếu nại sản phẩm", icon: Ticket },
  { to: "/members", label: "Học viên", icon: Users },
  { to: "/crm", label: "CRM", icon: ClipboardList },
];
const admin: NavItem[] = [
  { to: "/admin/coaches", label: "Quản lý Coach", icon: Users },
  { to: "/admin/exercises", label: "Exercise Library", icon: Dumbbell },
  { to: "/admin/workouts", label: "Workout Governance", icon: ClipboardList },
  { to: "/admin/reviews", label: "Review Moderation", icon: Star },
  { to: "/admin", label: "Tổng quan quản trị", icon: Shield },
  { to: "/admin/shops", label: "Shops", icon: Store },
  { to: "/admin/brand-requests", label: "Brand Requests", icon: ClipboardList },
  { to: "/admin/seller-applications", label: "Seller Applications", icon: UserCheck },
  { to: "/admin/product-moderation", label: "Duyệt sản phẩm", icon: ClipboardList },
  { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { to: "/admin/complaints", label: "Complaint Inbox", icon: Ticket },
  { to: "/admin/refunds", label: "Hoàn tiền", icon: Wallet },
  { to: "/admin/settlements", label: "Đối soát Seller", icon: Wallet },
  { to: "/admin/products", label: "Sản phẩm", icon: Boxes },
  { to: "/admin/inventory", label: "Tồn kho", icon: Package },
  { to: "/admin/analytics", label: "Phân tích", icon: BarChart3 },
  { to: "/admin/revenue", label: "Doanh thu membership", icon: Wallet },
  { to: "/admin/audit", label: "Audit log", icon: FileText },
];
const seller: NavItem[] = [
  { to: "/seller/reviews", label: "Đánh giá", icon: Star },
  { to: "/seller", label: "Seller workspace", icon: Store },
  { to: "/seller/shop", label: "Hồ sơ Shop", icon: Store },
  { to: "/seller/orders", label: "Shop orders", icon: ShoppingCart },
  { to: "/seller/complaints", label: "Khiếu nại", icon: Ticket },
  { to: "/seller/revenue", label: "Doanh thu", icon: Wallet },
  { to: "/seller/products", label: "Sản phẩm", icon: Boxes },
  { to: "/seller/brand-requests", label: "Yêu cầu Brand", icon: ClipboardList },
  { to: "/seller/apply", label: "Hồ sơ đã duyệt", icon: UserCheck },
  { to: "/settings", label: "Cài đặt", icon: Settings },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [adminOpen, setAdminOpen] = useState(true);
  const role = user?.role as Role | undefined;
  const groups = role === "admin"
    ? [{ label: "Quản trị", items: admin }]
    : role === "coach"
      ? [{ label: "Không gian Coach", items: coach }, { label: "Chung", items: common }]
      : role === "seller"
        ? [{ label: "Kênh người bán", items: seller }]
        : [{ label: "Cá nhân", items: member }, { label: "Chung", items: common }];
  const signOut = async () => { await logout(); window.location.replace("/login"); };
  return <aside className="command-sidebar">
    <div className="sidebar-brand"><div className="brand-mark">G</div><div><strong>GYMFIT</strong><small>COMMAND CENTER</small></div>{onClose && <button className="icon-button mobile-close" onClick={onClose} aria-label="Đóng menu"><X size={18}/></button>}</div>
    <div className="sidebar-context"><span className="status-dot"/> {role === "admin" ? "ADMIN CONTROL" : role === "coach" ? "COACH WORKSPACE" : role === "seller" ? "SELLER WORKSPACE" : "MEMBER SPACE"}</div>
    <nav className="sidebar-nav" aria-label="Điều hướng chính">
      {groups.map(group => <div className="nav-group" key={group.label}><span className="nav-label">{group.label}</span>{group.items.filter(item => role && canAccess(role, item.to)).map(item => <Link key={item.to} to={item.to} onClick={onClose} className={`nav-item ${location.pathname === item.to || location.pathname.startsWith(`${item.to}/`) ? "active" : ""}`}><item.icon size={17}/><span>{item.label}</span></Link>)}</div>)}
      {role === "admin" && <div className="nav-group"><button className="nav-label nav-toggle" onClick={() => setAdminOpen(value => !value)}>Hệ thống <ChevronDown size={14} className={adminOpen ? "" : "rotate-[-90deg]"}/></button>{adminOpen && <Link to="/admin/backup" onClick={onClose} className={`nav-item ${location.pathname === "/admin/backup" ? "active" : ""}`}><Shield size={17}/><span>Backup</span></Link>}</div>}
    </nav>
    <div className="sidebar-footer"><div className="profile-row"><div className="avatar">{user?.name?.slice(0,1).toUpperCase() || "G"}</div><div><strong>{user?.name || "GYMFIT user"}</strong><small>{role || "member"}</small></div></div><button className="logout-button" onClick={() => void signOut()}><LogOut size={16}/>Đăng xuất</button></div>
  </aside>;
}
