import { getPool,sql } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";
import type {
  PaginatedSellerShopOrders,
  SellerShopOrderDetail,
  SellerShopOrderFilters,
  SellerShopOrderItem,
  SellerShopOrderSummary,
} from "./seller-orders.types";

async function ownShopId(userId:number):Promise<number> {
  const result=await (await getPool()).request()
    .input("userId",sql.Int,userId)
    .query<{id:number}>("SELECT id FROM dbo.Shops WHERE owner_user_id=@userId");
  const shop=result.recordset[0];
  if(!shop) throw new AppError(404,"Seller Shop not found");
  return shop.id;
}

export const sellerOrdersService={
  async list(userId:number,filters:SellerShopOrderFilters):Promise<PaginatedSellerShopOrders>{
    const shopId=await ownShopId(userId);
    const request=(await getPool()).request()
      .input("shopId",sql.Int,shopId)
      .input("offset",sql.Int,(filters.page-1)*filters.limit)
      .input("limit",sql.Int,filters.limit);
    const clauses=["so.shop_id=@shopId"];
    if(filters.status){
      request.input("status",sql.NVarChar(30),filters.status);
      clauses.push("so.status=@status");
    }
    const direction=filters.sortOrder==="asc"?"ASC":"DESC";
    const result=await request.query<SellerShopOrderSummary&{totalCount:number}>(
      `SELECT so.id,o.id AS parentOrderId,o.order_number AS parentOrderNumber,so.status,so.subtotal,o.currency,COUNT(oi.id) AS itemCount,so.created_at AS createdAt,so.updated_at AS updatedAt,COUNT_BIG(*) OVER() AS totalCount FROM dbo.ShopOrders so JOIN dbo.Orders o ON o.id=so.order_id LEFT JOIN dbo.OrderItems oi ON oi.shop_order_id=so.id WHERE ${clauses.join(" AND ")} GROUP BY so.id,o.id,o.order_number,so.status,so.subtotal,o.currency,so.created_at,so.updated_at ORDER BY so.created_at ${direction},so.id ${direction} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    );
    const total=Number(result.recordset[0]?.totalCount??0);
    return {
      items:result.recordset.map(({totalCount:_totalCount,...item})=>item),
      page:filters.page,
      limit:filters.limit,
      total,
      totalPages:Math.ceil(total/filters.limit),
    };
  },

  async detail(userId:number,shopOrderId:number):Promise<SellerShopOrderDetail>{
    const shopId=await ownShopId(userId);
    const pool=await getPool();
    const result=await pool.request()
      .input("shopId",sql.Int,shopId)
      .input("shopOrderId",sql.Int,shopOrderId)
      .query<SellerShopOrderDetail&{
        customerName:string;
        customerPhone:string|null;
        addressLine1:string|null;
        addressLine2:string|null;
        city:string|null;
        state:string|null;
        postalCode:string|null;
        country:string|null;
      }>(
        "SELECT so.id,o.id AS parentOrderId,o.order_number AS parentOrderNumber,so.status,so.subtotal,o.currency,(SELECT COUNT(*) FROM dbo.OrderItems oi WHERE oi.shop_order_id=so.id) AS itemCount,so.created_at AS createdAt,so.updated_at AS updatedAt,o.customer_name AS customerName,o.customer_phone AS customerPhone,o.shipping_address_line1 AS addressLine1,o.shipping_address_line2 AS addressLine2,o.shipping_city AS city,o.shipping_state AS state,o.shipping_postal_code AS postalCode,o.shipping_country AS country FROM dbo.ShopOrders so JOIN dbo.Orders o ON o.id=so.order_id WHERE so.id=@shopOrderId AND so.shop_id=@shopId",
      );
    const row=result.recordset[0];
    if(!row) throw new AppError(404,"ShopOrder not found");
    const items=await pool.request()
      .input("itemShopOrderId",sql.Int,shopOrderId)
      .input("itemShopId",sql.Int,shopId)
      .query<SellerShopOrderItem>(
        "SELECT oi.id,oi.product_id AS productId,oi.variant_id AS variantId,oi.product_name AS productName,oi.variant_name AS variantName,oi.sku,oi.quantity,oi.unit_price AS unitPrice,oi.line_total AS lineTotal FROM dbo.OrderItems oi JOIN dbo.ShopOrders so ON so.id=oi.shop_order_id WHERE oi.shop_order_id=@itemShopOrderId AND so.shop_id=@itemShopId ORDER BY oi.id",
      );
    return {
      id:row.id,
      parentOrderId:row.parentOrderId,
      parentOrderNumber:row.parentOrderNumber,
      status:row.status,
      subtotal:row.subtotal,
      currency:row.currency,
      itemCount:row.itemCount,
      createdAt:row.createdAt,
      updatedAt:row.updatedAt,
      shipping:{
        name:row.customerName,
        phone:row.customerPhone,
        addressLine1:row.addressLine1,
        addressLine2:row.addressLine2,
        city:row.city,
        state:row.state,
        postalCode:row.postalCode,
        country:row.country,
      },
      items:items.recordset,
    };
  },
};
