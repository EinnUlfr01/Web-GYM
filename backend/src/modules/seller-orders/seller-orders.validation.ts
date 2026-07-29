import { z } from "zod";

const status=z.enum(["PENDING_PAYMENT","PENDING_STOCK_CHECK","PREPARING","READY_FOR_PICKUP","UNABLE_TO_FULFILL","CANCELLED"]);
export const sellerShopOrderId=z.object({shopOrderId:z.coerce.number().int().safe().positive()}).strict();
export const sellerShopOrderList=z.object({
  page:z.coerce.number().int().positive().default(1),
  limit:z.coerce.number().refine(value=>[10,20,50].includes(value)).default(10),
  status:status.optional(),
  sortOrder:z.enum(["asc","desc"]).default("desc"),
}).strict();
