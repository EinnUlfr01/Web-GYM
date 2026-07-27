import { z } from 'zod';
export const sellerProductIdSchema=z.object({productId:z.coerce.number().int().min(0)}).strict();
export const sellerProductListSchema=z.object({
 page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(20),
 search:z.string().trim().max(200).optional(),status:z.enum(['active','inactive']).optional(),
 sort:z.enum(['created_desc','created_asc','name_asc','name_desc']).default('created_desc'),
}).strict();
