import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Star, Crown, Shield, Users, Video, Dumbbell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getPlans, Plan, PENDING_PLAN_STORAGE_KEY } from '../../services/plans';
import { useAuthStore } from '../../stores/authStore';
import Skeleton from '../../components/ui/skeleton';

const iconMap = [Zap, Star, Crown] as const;
const colorMap = ['from-[#64748b] to-[#475569]', 'from-[#2563eb] to-[#0ea5e9]', 'from-[#8b5cf6] to-[#ec4899]'] as const;
const borderMap = ['border-[#1e293b]', 'border-[#2563eb]/50', 'border-[#1e293b]'] as const;

const comparisonFeatures = [
  { name: 'Gym Access', starter: '6am-10pm', pro: '24/7', elite: '24/7 + Family' },
  { name: 'Workout Programs', starter: 'Basic', pro: 'All programs', elite: 'All + Custom' },
  { name: 'Personal Coach', starter: false, pro: '2x/month', elite: 'Unlimited' },
  { name: 'Nutrition Planning', starter: false, pro: true, elite: 'Custom meals' },
  { name: 'Video Library', starter: 'Basic', pro: 'Full access', elite: 'Full + Exclusive' },
  { name: 'Guest Passes', starter: '1/month', pro: '5/month', elite: 'Unlimited' },
  { name: 'Priority Support', starter: false, pro: true, elite: true },
  { name: 'Recovery & Massage', starter: false, pro: false, elite: true },
];

export default function MembershipPlans() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setError('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  const plansToShow = plans.length > 0 ? plans : [];
  const popularIndex = plansToShow.length >= 2 ? 1 : -1;
  const choosePlan = (planId: number) => {
    if (user?.role === 'member') {
      navigate(`/membership/checkout?plan_id=${planId}`);
      return;
    }
    if (user) {
      navigate('/access-denied');
      return;
    }
    sessionStorage.setItem(PENDING_PLAN_STORAGE_KEY, String(planId));
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-[#020617] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto mb-8">
            Unlock your full potential with the right membership. Upgrade anytime.
          </p>
          <div className="flex items-center justify-center gap-2 bg-[#0f172a] p-1 rounded-lg w-fit mx-auto border border-[#1e293b]">
            <button onClick={() => setBilling('monthly')} className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-[#2563eb] text-white' : 'text-[#94a3b8] hover:text-white'}`}>
              Monthly
            </button>
            <button onClick={() => setBilling('yearly')} className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${billing === 'yearly' ? 'bg-[#2563eb] text-white' : 'text-[#94a3b8] hover:text-white'}`}>
              Yearly <span className="ml-1 inline-flex items-center rounded-full bg-[#22c55e]/20 px-2 py-0.5 text-[10px] font-semibold text-[#22c55e]">Save 20%</span>
            </button>
          </div>
          {user?.role === 'member' && <Link to="/membership/account" className="mt-5 inline-flex rounded-lg border border-[#334155] px-4 py-2 text-sm text-[#cbd5e1] hover:border-[#60a5fa] hover:text-white">Manage my membership</Link>}
        </motion.div>

        {/* Plans Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl border border-[#1e293b] bg-[#0f172a] p-8 space-y-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-40 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => { setError(''); setLoading(true); getPlans().then(setPlans).catch(() => setError('Failed')).finally(() => setLoading(false)); }} className="rounded-lg bg-[#2563eb] px-6 py-2 text-white font-medium hover:bg-[#1d4ed8]">
              Retry
            </button>
          </div>
        ) : plansToShow.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#94a3b8]">No plans available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {plansToShow.map((plan, i) => {
              const Icon = iconMap[i % iconMap.length];
              const color = colorMap[i % colorMap.length];
              const border = borderMap[i % borderMap.length];
              const isPopular = i === popularIndex;
              const price = billing === 'yearly' ? (plan.price * 12 * 0.8) : plan.price;
              const monthlyPrice = billing === 'yearly' ? price / 12 : price;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02, y: -8 }}
                  className={`relative rounded-2xl border ${border} bg-[#0f172a] overflow-hidden transition-all ${isPopular ? 'ring-2 ring-[#2563eb]/30 shadow-xl shadow-[#2563eb]/10' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-[#2563eb] text-white text-[10px] font-bold px-8 py-1 -mr-8 mt-3 rotate-45">POPULAR</div>
                    </div>
                  )}
                  <div className="p-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon size={28} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-[#94a3b8] mt-1 mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">${monthlyPrice.toFixed(0)}</span>
                      <span className="text-[#64748b] text-sm">/month</span>
                      {billing === 'yearly' && (
                        <p className="text-xs text-[#22c55e] mt-1">${price.toFixed(0)}/year billed annually</p>
                      )}
                    </div>
                    <button type="button" onClick={() => choosePlan(plan.id)} className={`block w-full rounded-lg py-3 text-center font-semibold transition-all ${isPopular ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]' : 'bg-[#1e293b] text-white hover:bg-[#2563eb]/20 border border-[#1e293b] hover:border-[#2563eb]/50'}`}>
                      {isPopular ? 'Start Free Trial' : 'Get Started'}
                    </button>
                    <div className="mt-8 space-y-3">
                      {(Array.isArray(plan.features) ? plan.features : []).map((feature, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <Check size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                          <span className="text-sm text-[#94a3b8]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Feature Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Feature Comparison</h2>
          <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f172a]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e293b]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">Starter</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[#60a5fa]">Pro ★</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">Elite</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, i) => (
                  <tr key={i} className="border-b border-[#1e293b] last:border-0">
                    <td className="px-6 py-4 text-sm text-[#94a3b8]">{feature.name}</td>
                    {(['starter', 'pro', 'elite'] as const).map(level => (
                      <td key={level} className="px-6 py-4 text-center text-sm">
                        {typeof feature[level] === 'boolean' ? (
                          feature[level] ? (
                            <Check size={16} className="mx-auto text-[#22c55e]" />
                          ) : (
                            <span className="text-[#64748b]">—</span>
                          )
                        ) : (
                          <span className={level === 'pro' ? 'text-[#60a5fa] font-medium' : 'text-[#94a3b8]'}>
                            {feature[level] as string}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Shield, title: 'Secure Payment', desc: '256-bit SSL encryption' },
            { icon: Users, title: '50K+ Members', desc: 'Trusted community' },
            { icon: Video, title: '500+ Videos', desc: 'Expert-led content' },
            { icon: Dumbbell, title: 'Cancel Anytime', desc: 'No lock-in contracts' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="text-center p-6 rounded-xl border border-[#1e293b] bg-[#0f172a]">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#2563eb]/10">
                  <Icon size={24} className="text-[#60a5fa]" />
                </div>
                <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-sm text-[#64748b]">{item.desc}</p>
              </div>
            );
          })}
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I switch plans anytime?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.' },
              { q: 'Is there a free trial?', a: 'Yes, all plans come with a 7-day free trial. No credit card required to start.' },
              { q: 'Can I cancel my membership?', a: 'Absolutely. There are no long-term contracts. You can cancel anytime from your account settings.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, and PayPal. All payments are securely processed.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-6">
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-[#94a3b8]">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Enterprise CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-16 text-center">
          <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a] p-8">
            <h3 className="text-xl font-bold text-white mb-2">Enterprise & Corporate Plans</h3>
            <p className="text-[#64748b] mb-4">Custom plans for businesses, teams, and organizations. Volume pricing available.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#020617] px-6 py-3 font-medium text-white transition-all hover:border-[#2563eb] hover:bg-[#0f172a]">
              Contact Sales
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
