import { useEffect, useState } from 'react';
import { commerceApi } from '../../services/commerce';
import type { InventoryRow } from '../../types/commerce';

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);

  useEffect(() => { commerceApi.adminInventory().then(setRows); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commerce Inventory</h1>
        <p className="text-sm text-[#94A3B8]">Authoritative stock from ProductVariants and Inventory.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-[#1e293b] bg-[#0F172A]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#020617] text-[#94A3B8]"><tr><th className="p-3">Product</th><th className="p-3">SKU</th><th className="p-3">On hand</th><th className="p-3">Reserved</th><th className="p-3">Available</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.variant_id} className="border-t border-[#1e293b]">
                <td className="p-3">{row.product_name}</td>
                <td className="p-3 text-[#94A3B8]">{row.sku}</td>
                <td className="p-3">{row.on_hand}</td>
                <td className="p-3">{row.reserved}</td>
                <td className="p-3">{row.available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
