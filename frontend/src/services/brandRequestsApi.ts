import api from '../api/axios';
export const brandRequestsApi={
 sellerList:(params:Record<string,unknown>={})=>api.get('/seller/brand-requests',{params}),sellerDetail:(id:number)=>api.get(`/seller/brand-requests/${id}`),
 create:(body:{requestedName:string;websiteUrl?:string|null;description?:string|null})=>api.post('/seller/brand-requests',body),
 adminList:(params:Record<string,unknown>={})=>api.get('/admin/brand-requests',{params}),adminDetail:(id:number)=>api.get(`/admin/brand-requests/${id}`),
 approve:(id:number)=>api.post(`/admin/brand-requests/${id}/approve`),reject:(id:number,reason:string)=>api.post(`/admin/brand-requests/${id}/reject`,{reason}),
};
