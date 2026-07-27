import { User } from '../types';
export type Role=User['role'];
export const roleHome=(role:Role)=>role==='admin'?'/admin':role==='coach'?'/coach':role==='seller'?'/seller':'/dashboard';
export const routeRoles:Record<string,Role[]>= {
  '/dashboard':['member','coach','admin'],'/members':['coach','admin'],'/crm':['coach','admin'],'/referral':['member'],'/coupons':['admin'],'/loyalty':['member'],'/tickets':['member','coach','admin'],'/invoices':['member','admin'],'/settings':['member','coach','admin','seller'],'/booking':['member','coach','admin'],'/profile':['member','coach','admin','seller'],'/orders':['member'],'/checkout':['member'],'/video':['coach','admin'],'/coach':['coach'],'/seller/apply':['member','coach','admin','seller'],'/seller':['seller'],'/seller/shop':['seller'],'/seller/brand-requests':['seller'],'/seller/products':['seller'],
};
export const canAccess=(role:Role,path:string)=>path.startsWith('/admin')?role==='admin':(routeRoles[path]||routeRoles[Object.keys(routeRoles).find(key=>path.startsWith(`${key}/`))||'']||[]).includes(role);
