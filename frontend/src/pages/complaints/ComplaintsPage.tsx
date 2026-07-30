import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

type Role = "buyer" | "seller" | "admin";
type Complaint = {
  id: number;
  orderNumber: string;
  shopOrderId: number;
  shopName: string;
  productName: string;
  variantName: string;
  affectedQuantity: number;
  category: string;
  description: string;
  status: string;
  faultParty: string;
  adminDecisionReason?: string | null;
  createdAt: string;
  settlementStatus: string;
  batchId?: number | null;
  replacementId?: number | null;
  replacementStatus?: string | null;
  replacementQuantity?: number | null;
  refundId?: number | null;
  refundStatus?: string | null;
  refundAmount?: number | null;
  events?: Array<{ id: number; eventType: string; newStatus?: string; reason: string; createdAt: string }>;
  replacementHistory?: Array<{ id: number; newStatus: string; reason: string; createdAt: string }>;
};

const endpoint = {
  buyer: "/complaints",
  seller: "/seller/complaints",
  admin: "/admin/complaints",
} as const;
const errorText = (error: any) =>
  error?.response?.data?.message || "Không thể hoàn tất thao tác.";

export default function ComplaintsPage({ role }: { role: Role }) {
  const [params] = useSearchParams();
  const [rows, setRows] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [faultParty, setFaultParty] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState({
    orderItemId: params.get("orderItemId") || "",
    category: "DAMAGED",
    affectedQuantity: "1",
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query =
        role === "admin"
          ? { status: status || undefined, faultParty: faultParty || undefined, search: search || undefined, from: from || undefined, to: to || undefined }
          : undefined;
      const response = await api.get<{ data: Complaint[] }>(endpoint[role], { params: query });
      setRows(response.data.data);
      if (selected) {
        const detail = await api.get<{ data: Complaint }>(`${endpoint[role]}/${selected.id}`);
        setSelected(detail.data.data);
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [role, status, faultParty, search, from, to, selected?.id]);
  useEffect(() => { void load(); }, [role, status, faultParty, from, to]);

  const open = async (id: number) => {
    setError("");
    try {
      setSelected((await api.get<{ data: Complaint }>(`${endpoint[role]}/${id}`)).data.data);
    } catch (e) { setError(errorText(e)); }
  };
  const action = async (path: string, body: object = {}) => {
    setError(""); setSuccess("");
    try {
      await api.post(path, body);
      setSuccess("Đã cập nhật thành công.");
      await load();
    } catch (e) { setError(errorText(e)); }
  };
  const create = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setSuccess("");
    try {
      const result = await api.post<{ data: Complaint }>("/complaints", {
        orderItemId: Number(form.orderItemId),
        category: form.category,
        affectedQuantity: Number(form.affectedQuantity),
        description: form.description,
      });
      setSelected(result.data.data);
      setSuccess("GymFit đã tiếp nhận khiếu nại. Settlement chưa bị giữ khi chưa có kết luận lỗi Seller.");
      setForm(value => ({ ...value, description: "" }));
      await load();
    } catch (e) { setError(errorText(e)); }
  };
  const reason = (label: string) => window.prompt(label)?.trim() || "";
  const adminDecision = async (kind: "seller-fault" | "buyer-fault" | "gymfit-carrier") => {
    if (!selected) return;
    const why = reason("Lý do quyết định (bắt buộc)");
    if (!why) return;
    if (kind === "seller-fault") {
      const quantity = Number(window.prompt("Số lượng thay thế", String(selected.affectedQuantity)));
      if (!Number.isInteger(quantity) || quantity < 1) return;
      await action(`/admin/complaints/${selected.id}/decisions/seller-fault`, { reason: why, replacementQuantity: quantity });
    } else {
      await action(`/admin/complaints/${selected.id}/decisions/${kind}`, { reason: why });
    }
  };
  const replacementAction = async (next: string) => {
    if (!selected?.replacementId) return;
    const needsReason = next === "HUB_CHECK_FAILED" || next === "FAILED";
    const why = needsReason ? reason("Lý do (bắt buộc)") : reason("Ghi chú (không bắt buộc)");
    if (needsReason && !why) return;
    await action(`/admin/complaints/replacements/${selected.replacementId}/actions`, { action: next, ...(why ? { reason: why } : {}) });
  };

  return <main className="space-y-5 p-4 md:p-8">
    <header>
      <h1 className="text-3xl font-bold">{role === "admin" ? "Admin Complaint Inbox" : role === "seller" ? "Khiếu nại của Shop" : "Khiếu nại sản phẩm"}</h1>
      <p className="text-slate-400">Replacement là phương án ưu tiên; refund chỉ là fallback sau khi replacement thất bại.</p>
    </header>
    {role === "buyer" && <form onSubmit={create} className="grid gap-3 rounded-xl border border-white/10 p-4 md:grid-cols-2">
      <label>OrderItem ID<input className="input-field mt-1 w-full" required type="number" min="1" value={form.orderItemId} onChange={e => setForm({ ...form, orderItemId: e.target.value })}/></label>
      <label>Loại khiếu nại<select className="input-field mt-1 w-full" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>DAMAGED</option><option>WRONG_ITEM</option><option>MISSING_QUANTITY</option><option>QUALITY_ISSUE</option><option>OTHER</option></select></label>
      <label>Số lượng ảnh hưởng<input className="input-field mt-1 w-full" required type="number" min="1" value={form.affectedQuantity} onChange={e => setForm({ ...form, affectedQuantity: e.target.value })}/></label>
      <label className="md:col-span-2">Mô tả<textarea className="input-field mt-1 w-full" required minLength={10} maxLength={2000} rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
      <p className="text-sm text-amber-300 md:col-span-2">Chỉ áp dụng trong 7 ngày từ khi giao và trước khi settlement PAID. Ngoài phạm vi này, vui lòng dùng <Link className="underline" to="/tickets">hỗ trợ thủ công</Link>; GymFit không hứa tự động hold hoặc refund.</p>
      <button className="btn-primary w-fit" type="submit">Gửi khiếu nại</button>
    </form>}
    {role === "admin" && <section className="flex flex-wrap gap-2 rounded-xl border border-white/10 p-4">
      <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}><option value="">Mọi status</option><option>OPEN</option><option>UNDER_REVIEW</option><option>REPLACEMENT_REQUIRED</option><option>RESOLVED</option><option>REJECTED</option></select>
      <select className="input-field" value={faultParty} onChange={e => setFaultParty(e.target.value)}><option value="">Mọi fault</option><option>UNDETERMINED</option><option>SELLER_FAULT</option><option>BUYER_FAULT</option><option>GYMFIT_OR_CARRIER</option></select>
      <input className="input-field" placeholder="Shop / Order / ID" value={search} onChange={e => setSearch(e.target.value)}/>
      <input className="input-field" type="date" value={from} onChange={e => setFrom(e.target.value)}/>
      <input className="input-field" type="date" value={to} onChange={e => setTo(e.target.value)}/>
      <button className="btn-secondary" onClick={() => void load()}>Tìm</button>
    </section>}
    {error && <p role="alert" className="rounded bg-red-500/10 p-3 text-red-300">{error}</p>}
    {success && <p role="status" className="rounded bg-emerald-500/10 p-3 text-emerald-300">{success}</p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.8fr)_1.2fr]">
      <section className="rounded-xl border border-white/10">
        {loading ? <p className="p-5">Đang tải…</p> : rows.length === 0 ? <p className="p-5 text-slate-400">Chưa có khiếu nại.</p> : rows.map(row => <button key={row.id} className="block w-full border-b border-white/10 p-4 text-left hover:bg-white/5" onClick={() => void open(row.id)}>
          <strong>#{row.id} · {row.productName}</strong><span className="block text-sm text-slate-400">{row.shopName} · {row.orderNumber}</span><span className="text-sm">{row.status} / {row.faultParty}</span>
        </button>)}
      </section>
      <section className="rounded-xl border border-white/10 p-5">
        {!selected ? <p className="text-slate-400">Chọn một khiếu nại để xem chi tiết.</p> : <div className="space-y-4">
          <div><h2 className="text-xl font-bold">Complaint #{selected.id}</h2><p>{selected.productName} · {selected.variantName} · SL {selected.affectedQuantity}</p><p>{selected.shopName} · {selected.orderNumber} / ShopOrder #{selected.shopOrderId}</p></div>
          <div className="grid gap-2 sm:grid-cols-2"><p>Status: <strong>{selected.status}</strong></p><p>Fault: <strong>{selected.faultParty}</strong></p><p>Settlement: <strong>{selected.settlementStatus}</strong></p><p>Batch: <strong>{selected.batchId || "—"}</strong></p></div>
          {selected.settlementStatus === "PAID" && <p className="rounded bg-amber-500/10 p-3 text-amber-200">Settlement đã PAID: chỉ manual support / carry-forward thủ công; không reopen, clawback hoặc tự áp adjustment.</p>}
          <p className="rounded bg-white/5 p-3">{selected.description}</p>
          {selected.adminDecisionReason && <p>Quyết định Admin: {selected.adminDecisionReason}</p>}
          {selected.replacementId && <p>Replacement #{selected.replacementId}: <strong>{selected.replacementStatus}</strong> · SL {selected.replacementQuantity}</p>}
          {selected.refundId && <p>Refund #{selected.refundId}: <strong>{selected.refundStatus}</strong> · {Number(selected.refundAmount || 0).toLocaleString("vi-VN")} VND</p>}
          {role === "seller" && selected.replacementStatus === "REQUIRED" && <button className="btn-primary" onClick={() => void action(`/seller/complaints/replacements/${selected.replacementId}/ready-for-pickup`)}>Đã chuẩn bị hàng thay thế</button>}
          {role === "admin" && <div className="flex flex-wrap gap-2">
            {selected.status === "OPEN" && <button className="btn-primary" onClick={() => { const why=reason("Lý do bắt đầu review"); if(why) void action(`/admin/complaints/${selected.id}/start-review`, { reason: why }); }}>Start review</button>}
            {selected.status === "UNDER_REVIEW" && selected.faultParty === "UNDETERMINED" && <><button onClick={() => void adminDecision("seller-fault")}>Seller fault + replacement</button><button onClick={() => void adminDecision("buyer-fault")}>Buyer fault / reject</button><button onClick={() => void adminDecision("gymfit-carrier")}>GymFit/carrier fault</button></>}
            {selected.replacementId && ["READY_FOR_PICKUP","PICKED_UP","IN_TRANSIT_TO_HUB","RECEIVED_AT_HUB","HUB_CHECK_FAILED","HUB_CHECK_PASSED","SHIPPED"].includes(selected.replacementStatus || "") && ["PICKED_UP","IN_TRANSIT_TO_HUB","RECEIVED_AT_HUB","HUB_CHECK_PASSED","HUB_CHECK_FAILED","SHIPPED","DELIVERED","FAILED"].map(next => <button key={next} onClick={() => void replacementAction(next)}>{next}</button>)}
            {selected.replacementStatus === "FAILED" && !selected.refundId && <button onClick={() => { const why=reason("Lý do refund fallback"); if(why) void action(`/admin/complaints/${selected.id}/refund-fallback`, { reason: why }); }}>Create refund fallback</button>}
            {selected.faultParty === "GYMFIT_OR_CARRIER" && selected.status === "UNDER_REVIEW" && <button onClick={() => { const why=reason("Resolution thủ công"); if(why) void action(`/admin/complaints/${selected.id}/resolve`, { resolutionType:"MANUAL_SUPPORT", reason:why }); }}>Resolve manual support</button>}
            {selected.refundStatus === "COMPLETED" && selected.status !== "RESOLVED" && <button onClick={() => { const why=reason("Lý do đóng complaint"); if(why) void action(`/admin/complaints/${selected.id}/resolve`, { resolutionType:"REFUND", reason:why }); }}>Resolve after refund</button>}
          </div>}
          <div><h3 className="font-semibold">Timeline</h3><ol className="mt-2 space-y-2">{selected.events?.map(event => <li key={event.id} className="border-l border-white/20 pl-3"><strong>{event.eventType}</strong> · {new Date(event.createdAt).toLocaleString("vi-VN")}<span className="block text-sm text-slate-400">{event.reason}</span></li>)}</ol></div>
          {!!selected.replacementHistory?.length && <div><h3 className="font-semibold">Replacement timeline</h3><ol className="mt-2 space-y-2">{selected.replacementHistory.map(event => <li key={event.id}>{event.newStatus} · {new Date(event.createdAt).toLocaleString("vi-VN")}</li>)}</ol></div>}
        </div>}
      </section>
    </div>
  </main>;
}
