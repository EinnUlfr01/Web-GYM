import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Gift, Ticket, ShoppingBag, Star, BarChart3, LogOut, Wallet, Shield, FileText, Database, Building2, ChevronDown, X, PackageCheck, Boxes } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useState } from 'react';

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/referral', icon: Gift, label: 'Referral' },
  { to: '/coupons', icon: ShoppingBag, label: 'Coupons' },
  { to: '/loyalty', icon: Star, label: 'Loyalty Points' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/crm', icon: Building2, label: 'CRM' },
  { to: '/cart', icon: ShoppingBag, label: 'Cart' },
  { to: '/orders', icon: PackageCheck, label: 'Orders' },
]

const adminLinks = [
  { to: '/admin', icon: Shield, label: 'Admin' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/revenue', icon: Wallet, label: 'Revenue' },
  { to: '/admin/orders', icon: PackageCheck, label: 'Commerce Orders' },
  { to: '/admin/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/admin/audit', icon: Database, label: 'Audit Log' },
  { to: '/admin/backup', icon: Shield, label: 'Backup' },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore();
  const [adminOpen, setAdminOpen] = useState(true);

  return (
    <aside className='w-64 bg-[#0F172A] border-r border-[#1e293b] flex flex-col h-full' role='navigation' aria-label='Main navigation'>
      <div className='p-6 border-b border-[#1e293b]'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-bold tracking-tight'>GYM<span className='text-[#22C55E]'>ER</span></h1>
          {onClose && <button onClick={onClose} className='btn-ghost p-1 rounded-lg md:hidden' aria-label='Close sidebar'><X size={18} /></button>}
        </div>
        <p className='text-xs text-[#64748B] mt-1'>Enterprise Management</p>
      </div>
      <nav className='flex-1 overflow-y-auto p-4 space-y-1'>
        {navLinks.map(l => (
          <NavLink key={l.to} to={l.to} onClick={onClose} className={({isActive}) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <l.icon size={18} /><span>{l.label}</span>
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <div className='pt-3'>
            <button onClick={() => setAdminOpen(!adminOpen)} className='flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-white transition-colors'>
              <ChevronDown size={14} className={'transition-transform ' + (adminOpen ? '' : '-rotate-90')} />
              <span>Admin</span>
            </button>
            {adminOpen && <div className='mt-1 space-y-1 pl-2'>{adminLinks.map(l => (
              <NavLink key={l.to} to={l.to} onClick={onClose} className={({isActive}) => 'sidebar-link' + (isActive ? ' active' : '')}>
                <l.icon size={18} /><span>{l.label}</span>
              </NavLink>
            ))}</div>}
          </div>
        )}
      </nav>
      <div className='p-4 border-t border-[#1e293b]'>
        <div className='flex items-center gap-3 mb-3'>
          <div className='w-8 h-8 rounded-full bg-[#22C55E]/20 flex items-center justify-center text-sm font-medium text-[#22C55E]'>{user?.name?.[0] || '?'}</div>
          <div className='flex-1 min-w-0'><p className='text-sm font-medium truncate'>{user?.name}</p><p className='text-xs text-[#64748B] capitalize'>{user?.role}</p></div>
        </div>
        <button onClick={logout} className='sidebar-link w-full justify-start' aria-label='Logout'><LogOut size={18} /><span>Logout</span></button>
      </div>
    </aside>
  )
}
