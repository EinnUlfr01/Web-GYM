import api from '../api/axios';

export const PENDING_PLAN_STORAGE_KEY = 'gymfit_pending_plan_id';
export type MembershipLifecycle = 'PENDING_PAYMENT' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  type: 'monthly' | 'yearly';
  features: string[];
  sortOrder: number;
}

interface PlanRaw {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  type: string;
  features: string | string[];
  sort_order: number;
}

interface MembershipRaw {
  id: number;
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status: string;
  payment_id: number | null;
  auto_renew: boolean;
  created_at: string;
  plan?: PlanRaw | null;
}

interface PaymentRaw {
  id: number;
  user_id: number;
  plan_id: number | null;
  amount: number;
  method: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
  plan?: PlanRaw | null;
}

export interface MembershipRecord extends Omit<MembershipRaw, 'plan'> {
  plan: Plan | null;
}

export interface MembershipPayment extends Omit<PaymentRaw, 'plan'> {
  plan: Plan | null;
}

export interface MembershipState {
  lifecycle: MembershipLifecycle | null;
  membership: MembershipRecord | null;
  pendingPayment: MembershipPayment | null;
}

export async function getPlans(): Promise<Plan[]> {
  const { data } = await api.get('/plans');
  return (data.data as PlanRaw[]).map(mapPlan);
}

function mapPlan(r: PlanRaw): Plan {
  let features: string[] = [];
  if (typeof r.features === 'string') {
    try { features = JSON.parse(r.features); } catch { features = [r.features]; }
  } else if (Array.isArray(r.features)) {
    features = r.features;
  }
  return {
    id: r.id, name: r.name, description: r.description || '',
    price: r.price, durationDays: r.duration_days,
    type: r.type as 'monthly' | 'yearly',
    features, sortOrder: r.sort_order
  };
}

function mapMembershipState(raw: { lifecycle: MembershipLifecycle | null; membership: MembershipRaw | null; pendingPayment: PaymentRaw | null }): MembershipState {
  return {
    lifecycle: raw.lifecycle,
    membership: raw.membership ? { ...raw.membership, plan: raw.membership.plan ? mapPlan(raw.membership.plan) : null } : null,
    pendingPayment: raw.pendingPayment ? { ...raw.pendingPayment, plan: raw.pendingPayment.plan ? mapPlan(raw.pendingPayment.plan) : null } : null,
  };
}

export async function getMyMembership(): Promise<MembershipState> {
  const { data } = await api.get('/plans/my-membership');
  return mapMembershipState(data.data);
}

export async function subscribeToPlan(planId: number): Promise<MembershipState> {
  const { data } = await api.post('/plans/subscribe', { plan_id: planId });
  return mapMembershipState(data.data);
}

export async function confirmMembershipPayment(paymentId: number): Promise<MembershipState> {
  const { data } = await api.post('/plans/subscribe/confirm', { payment_id: paymentId });
  return mapMembershipState(data.data);
}

export async function upgradeMembership(planId: number): Promise<MembershipState> {
  const { data } = await api.post('/plans/upgrade', { plan_id: planId });
  return mapMembershipState(data.data);
}

export async function downgradeMembership(planId: number): Promise<MembershipState> {
  const { data } = await api.post('/plans/downgrade', { plan_id: planId });
  return mapMembershipState(data.data);
}

export async function cancelMembership(): Promise<MembershipState> {
  const { data } = await api.post('/plans/cancel');
  return mapMembershipState(data.data);
}
