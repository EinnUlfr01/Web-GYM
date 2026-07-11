import { getPool, sql } from '../../config/database';

export type CartLineInput = { variant_id: number; quantity: number };

const orderLineSelect = `
SELECT
  ci.id AS cart_item_id,
  ci.quantity,
  v.id AS variant_id,
  v.product_id,
  v.variant_name,
  v.sku,
  v.price,
  v.sale_price,
  CASE WHEN v.sale_price IS NOT NULL AND v.sale_price < v.price THEN v.sale_price ELSE v.price END AS effective_price,
  v.is_active,
  i.available,
  p.product_name,
  p.slug,
  pi.image_url
FROM dbo.CartItems ci
JOIN dbo.ProductVariants v ON v.id = ci.variant_id
JOIN dbo.Products p ON p.id = v.product_id
JOIN dbo.Inventory i ON i.variant_id = v.id
OUTER APPLY (
  SELECT TOP (1) image_url
  FROM dbo.ProductImages pi
  WHERE pi.product_id = p.id
  ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
) pi`;

function mapCartLine(row: any) {
  const unitPrice = Number(row.effective_price);
  const quantity = Number(row.quantity);
  return {
    id: row.cart_item_id,
    variant_id: row.variant_id,
    product_id: row.product_id,
    product_name: row.product_name,
    slug: row.slug,
    variant_name: row.variant_name,
    sku: row.sku,
    unit_price: unitPrice,
    price: Number(row.price),
    sale_price: row.sale_price == null ? null : Number(row.sale_price),
    available: Number(row.available),
    quantity,
    line_total: unitPrice * quantity,
    image_url: row.image_url,
    is_active: Boolean(row.is_active)
  };
}

async function getOrCreateCartId(userId: number, tx?: sql.Transaction) {
  const pool = tx ? null : await getPool();
  const req = tx ? new sql.Request(tx) : pool!.request();
  const existing = await req.input('userId', userId).query(`
    SELECT TOP (1) id FROM dbo.Carts WHERE user_id = @userId AND status = N'active' ORDER BY id DESC
  `);
  if (existing.recordset[0]) return existing.recordset[0].id as number;

  const createReq = tx ? new sql.Request(tx) : pool!.request();
  const created = await createReq.input('userId', userId).query(`
    INSERT INTO dbo.Carts (user_id, status) OUTPUT INSERTED.id VALUES (@userId, N'active')
  `);
  return created.recordset[0].id as number;
}

export async function getCart(userId: number) {
  const pool = await getPool();
  const cartId = await getOrCreateCartId(userId);
  const result = await pool.request().input('cartId', cartId).query(`
    ${orderLineSelect}
    WHERE ci.cart_id = @cartId
    ORDER BY ci.created_at ASC
  `);
  const items = result.recordset.map(mapCartLine);
  return {
    id: cartId,
    items,
    subtotal: items.reduce((sum: number, item: any) => sum + item.line_total, 0),
    count: items.reduce((sum: number, item: any) => sum + item.quantity, 0)
  };
}

async function assertVariantAvailable(variantId: number, quantity: number, tx?: sql.Transaction) {
  const pool = tx ? null : await getPool();
  const req = tx ? new sql.Request(tx) : pool!.request();
  const result = await req.input('variantId', variantId).query(`
    SELECT v.id, v.is_active, i.available
    FROM dbo.ProductVariants v
    JOIN dbo.Inventory i ON i.variant_id = v.id
    WHERE v.id = @variantId
  `);
  const variant = result.recordset[0];
  if (!variant || !variant.is_active) throw new Error('Product variant is unavailable');
  if (Number(variant.available) < quantity) throw new Error('Requested quantity exceeds available stock');
}

export async function addCartItem(userId: number, input: CartLineInput) {
  if (input.quantity <= 0) throw new Error('Quantity must be positive');
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const cartId = await getOrCreateCartId(userId, tx);
    const existing = await new sql.Request(tx)
      .input('cartId', cartId)
      .input('variantId', input.variant_id)
      .query('SELECT quantity FROM dbo.CartItems WHERE cart_id = @cartId AND variant_id = @variantId');
    const nextQty = Number(existing.recordset[0]?.quantity || 0) + input.quantity;
    await assertVariantAvailable(input.variant_id, nextQty, tx);
    await new sql.Request(tx)
      .input('cartId', cartId)
      .input('variantId', input.variant_id)
      .input('quantity', input.quantity)
      .query(`
        MERGE dbo.CartItems AS target
        USING (SELECT @cartId AS cart_id, @variantId AS variant_id) AS source
        ON target.cart_id = source.cart_id AND target.variant_id = source.variant_id
        WHEN MATCHED THEN UPDATE SET quantity = target.quantity + @quantity, updated_at = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT (cart_id, variant_id, quantity) VALUES (@cartId, @variantId, @quantity);
      `);
    await tx.commit();
    return getCart(userId);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function updateCartItem(userId: number, itemId: number, quantity: number) {
  if (quantity <= 0) return removeCartItem(userId, itemId);
  const pool = await getPool();
  const cartId = await getOrCreateCartId(userId);
  const item = await pool.request().input('cartId', cartId).input('itemId', itemId).query(`
    SELECT variant_id FROM dbo.CartItems WHERE id = @itemId AND cart_id = @cartId
  `);
  if (!item.recordset[0]) throw new Error('Cart item not found');
  await assertVariantAvailable(item.recordset[0].variant_id, quantity);
  await pool.request()
    .input('cartId', cartId)
    .input('itemId', itemId)
    .input('quantity', quantity)
    .query('UPDATE dbo.CartItems SET quantity = @quantity, updated_at = SYSUTCDATETIME() WHERE id = @itemId AND cart_id = @cartId');
  return getCart(userId);
}

export async function removeCartItem(userId: number, itemId: number) {
  const pool = await getPool();
  const cartId = await getOrCreateCartId(userId);
  await pool.request().input('cartId', cartId).input('itemId', itemId).query(`
    DELETE FROM dbo.CartItems WHERE id = @itemId AND cart_id = @cartId
  `);
  return getCart(userId);
}

export async function mergeCart(userId: number, lines: CartLineInput[]) {
  const adjustments: any[] = [];
  for (const line of lines) {
    try {
      await addCartItem(userId, line);
    } catch (error: any) {
      adjustments.push({ variant_id: line.variant_id, quantity: line.quantity, reason: error.message });
    }
  }
  return { cart: await getCart(userId), adjustments };
}

export async function listAddresses(userId: number) {
  const pool = await getPool();
  const result = await pool.request().input('userId', userId).query(`
    SELECT * FROM dbo.UserAddresses WHERE user_id = @userId ORDER BY is_default DESC, id DESC
  `);
  return result.recordset;
}

export async function createAddress(userId: number, body: any) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    if (body.is_default) {
      await new sql.Request(tx).input('userId', userId).query('UPDATE dbo.UserAddresses SET is_default = 0 WHERE user_id = @userId');
    }
    const result = await new sql.Request(tx)
      .input('userId', userId)
      .input('recipientName', body.recipient_name)
      .input('phone', body.phone)
      .input('addressLine', body.address_line)
      .input('ward', body.ward)
      .input('district', body.district)
      .input('provinceCity', body.province_city)
      .input('postalCode', body.postal_code || null)
      .input('isDefault', Boolean(body.is_default))
      .query(`
        INSERT INTO dbo.UserAddresses
          (user_id, recipient_name, phone, address_line, ward, district, province_city, postal_code, is_default)
        OUTPUT INSERTED.*
        VALUES (@userId, @recipientName, @phone, @addressLine, @ward, @district, @provinceCity, @postalCode, @isDefault)
      `);
    await tx.commit();
    return result.recordset[0];
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function updateAddress(userId: number, id: number, body: any) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    if (body.is_default) {
      await new sql.Request(tx).input('userId', userId).query('UPDATE dbo.UserAddresses SET is_default = 0 WHERE user_id = @userId');
    }
    const result = await new sql.Request(tx)
      .input('userId', userId)
      .input('id', id)
      .input('recipientName', body.recipient_name)
      .input('phone', body.phone)
      .input('addressLine', body.address_line)
      .input('ward', body.ward)
      .input('district', body.district)
      .input('provinceCity', body.province_city)
      .input('postalCode', body.postal_code || null)
      .input('isDefault', Boolean(body.is_default))
      .query(`
        UPDATE dbo.UserAddresses
        SET recipient_name = @recipientName, phone = @phone, address_line = @addressLine,
            ward = @ward, district = @district, province_city = @provinceCity,
            postal_code = @postalCode, is_default = @isDefault, updated_at = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE id = @id AND user_id = @userId
      `);
    if (!result.recordset[0]) throw new Error('Address not found');
    await tx.commit();
    return result.recordset[0];
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function deleteAddress(userId: number, id: number) {
  const pool = await getPool();
  await pool.request().input('userId', userId).input('id', id).query('DELETE FROM dbo.UserAddresses WHERE id = @id AND user_id = @userId');
}

export async function setDefaultAddress(userId: number, id: number) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await new sql.Request(tx).input('userId', userId).query('UPDATE dbo.UserAddresses SET is_default = 0 WHERE user_id = @userId');
    const result = await new sql.Request(tx).input('userId', userId).input('id', id).query(`
      UPDATE dbo.UserAddresses SET is_default = 1, updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id AND user_id = @userId
    `);
    if (!result.recordset[0]) throw new Error('Address not found');
    await tx.commit();
    return result.recordset[0];
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function previewCheckout(userId: number, addressId?: number) {
  const cart = await getCart(userId);
  if (cart.items.length === 0) throw new Error('Cart is empty');
  const invalid = cart.items.filter((item: any) => !item.is_active || item.quantity > item.available);
  if (invalid.length > 0) throw new Error('Cart contains unavailable quantities');
  const addresses = await listAddresses(userId);
  const address = addressId ? addresses.find((item: any) => item.id === addressId) : addresses.find((item: any) => item.is_default) || addresses[0];
  return {
    cart,
    address: address || null,
    subtotal: cart.subtotal,
    discount_total: 0,
    shipping_fee: 0,
    grand_total: cart.subtotal,
    currency: 'USD',
    payment_methods: ['COD']
  };
}

function orderNumber() {
  return `GYM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function placeOrder(userId: number, addressId: number) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const cartId = await getOrCreateCartId(userId, tx);
    const addressResult = await new sql.Request(tx).input('userId', userId).input('addressId', addressId).query(`
      SELECT * FROM dbo.UserAddresses WHERE id = @addressId AND user_id = @userId
    `);
    const address = addressResult.recordset[0];
    if (!address) throw new Error('Shipping address not found');

    const linesResult = await new sql.Request(tx).input('cartId', cartId).query(`
      ${orderLineSelect}
      WHERE ci.cart_id = @cartId
      ORDER BY ci.created_at ASC
    `);
    const lines = linesResult.recordset.map(mapCartLine);
    if (lines.length === 0) throw new Error('Cart is empty');
    for (const line of lines) {
      if (!line.is_active || line.quantity > line.available) throw new Error(`Insufficient stock for ${line.product_name}`);
    }

    const subtotal = lines.reduce((sum: number, line: any) => sum + line.line_total, 0);
    const orderResult = await new sql.Request(tx)
      .input('orderNumber', orderNumber())
      .input('userId', userId)
      .input('subtotal', subtotal)
      .input('grandTotal', subtotal)
      .input('recipientName', address.recipient_name)
      .input('phone', address.phone)
      .input('addressLine', address.address_line)
      .input('ward', address.ward)
      .input('district', address.district)
      .input('provinceCity', address.province_city)
      .input('postalCode', address.postal_code)
      .query(`
        INSERT INTO dbo.Orders
          (order_number, user_id, status, subtotal, discount_total, shipping_fee, grand_total, currency,
           recipient_name, phone, address_line, ward, district, province_city, postal_code)
        OUTPUT INSERTED.*
        VALUES
          (@orderNumber, @userId, N'CONFIRMED', @subtotal, 0, 0, @grandTotal, N'USD',
           @recipientName, @phone, @addressLine, @ward, @district, @provinceCity, @postalCode)
      `);
    const order = orderResult.recordset[0];

    for (const line of lines) {
      await new sql.Request(tx)
        .input('orderId', order.id)
        .input('productId', line.product_id)
        .input('variantId', line.variant_id)
        .input('productName', line.product_name)
        .input('variantName', line.variant_name)
        .input('sku', line.sku)
        .input('options', '[]')
        .input('unitPrice', line.unit_price)
        .input('quantity', line.quantity)
        .input('lineTotal', line.line_total)
        .input('imageUrl', line.image_url || null)
        .query(`
          INSERT INTO dbo.OrderItems
            (order_id, product_id, variant_id, product_name_snapshot, variant_name_snapshot, sku_snapshot,
             options_snapshot, unit_price_snapshot, quantity, line_total, image_url_snapshot)
          VALUES
            (@orderId, @productId, @variantId, @productName, @variantName, @sku,
             @options, @unitPrice, @quantity, @lineTotal, @imageUrl)
        `);
      await new sql.Request(tx)
        .input('variantId', line.variant_id)
        .input('quantity', line.quantity)
        .query('UPDATE dbo.Inventory SET reserved = reserved + @quantity, updated_at = SYSUTCDATETIME() WHERE variant_id = @variantId');
    }

    await new sql.Request(tx)
      .input('orderId', order.id)
      .input('amount', subtotal)
      .query(`
        INSERT INTO dbo.OrderPayments (order_id, method, provider, status, amount)
        VALUES (@orderId, N'COD', N'COD', N'UNPAID', @amount)
      `);
    await new sql.Request(tx).input('cartId', cartId).query('DELETE FROM dbo.CartItems WHERE cart_id = @cartId');
    await new sql.Request(tx).input('cartId', cartId).query("UPDATE dbo.Carts SET status = N'ordered', updated_at = SYSUTCDATETIME() WHERE id = @cartId");
    await tx.commit();
    return getOrder(userId, order.id);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function listOrders(userId: number) {
  const pool = await getPool();
  const result = await pool.request().input('userId', userId).query(`
    SELECT o.*, op.status AS payment_status, op.method AS payment_method
    FROM dbo.Orders o
    LEFT JOIN dbo.OrderPayments op ON op.order_id = o.id
    WHERE o.user_id = @userId
    ORDER BY o.created_at DESC
  `);
  return result.recordset;
}

export async function getOrder(userId: number, orderId: number, admin = false) {
  const pool = await getPool();
  const orderReq = pool.request().input('orderId', orderId);
  if (!admin) orderReq.input('userId', userId);
  const orderResult = await orderReq.query(`
    SELECT o.*, op.status AS payment_status, op.method AS payment_method, op.amount AS payment_amount
    FROM dbo.Orders o
    LEFT JOIN dbo.OrderPayments op ON op.order_id = o.id
    WHERE o.id = @orderId ${admin ? '' : 'AND o.user_id = @userId'}
  `);
  const order = orderResult.recordset[0];
  if (!order) throw new Error('Order not found');
  const itemsResult = await pool.request().input('orderId', orderId).query('SELECT * FROM dbo.OrderItems WHERE order_id = @orderId ORDER BY id');
  return { ...order, items: itemsResult.recordset };
}

export async function cancelOrder(userId: number, orderId: number) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const order = await new sql.Request(tx).input('orderId', orderId).input('userId', userId).query(`
      SELECT * FROM dbo.Orders WHERE id = @orderId AND user_id = @userId
    `);
    const current = order.recordset[0];
    if (!current) throw new Error('Order not found');
    if (!['PENDING', 'CONFIRMED', 'PROCESSING'].includes(current.status)) throw new Error('Order can no longer be cancelled');
    const items = await new sql.Request(tx).input('orderId', orderId).query('SELECT variant_id, quantity FROM dbo.OrderItems WHERE order_id = @orderId');
    for (const item of items.recordset) {
      if (item.variant_id) {
        await new sql.Request(tx).input('variantId', item.variant_id).input('quantity', item.quantity).query(`
          UPDATE dbo.Inventory SET reserved = CASE WHEN reserved >= @quantity THEN reserved - @quantity ELSE 0 END,
              updated_at = SYSUTCDATETIME()
          WHERE variant_id = @variantId
        `);
      }
    }
    await new sql.Request(tx).input('orderId', orderId).query("UPDATE dbo.Orders SET status = N'CANCELLED', updated_at = SYSUTCDATETIME() WHERE id = @orderId");
    await tx.commit();
    return getOrder(userId, orderId);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function adminListOrders() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP (100) o.*, u.email, u.name, op.status AS payment_status, op.method AS payment_method
    FROM dbo.Orders o
    JOIN dbo.Users u ON u.id = o.user_id
    LEFT JOIN dbo.OrderPayments op ON op.order_id = o.id
    ORDER BY o.created_at DESC
  `);
  return result.recordset;
}

export async function updateOrderStatus(orderId: number, status: string) {
  const allowed = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (!allowed.includes(status)) throw new Error('Invalid order status');
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const current = await new sql.Request(tx).input('orderId', orderId).query('SELECT status FROM dbo.Orders WHERE id = @orderId');
    if (!current.recordset[0]) throw new Error('Order not found');
    if (status === 'DELIVERED' && current.recordset[0].status !== 'DELIVERED') {
      const items = await new sql.Request(tx).input('orderId', orderId).query('SELECT variant_id, quantity FROM dbo.OrderItems WHERE order_id = @orderId');
      for (const item of items.recordset) {
        if (item.variant_id) {
          await new sql.Request(tx).input('variantId', item.variant_id).input('quantity', item.quantity).query(`
            UPDATE dbo.Inventory
            SET on_hand = on_hand - @quantity,
                reserved = CASE WHEN reserved >= @quantity THEN reserved - @quantity ELSE 0 END,
                updated_at = SYSUTCDATETIME()
            WHERE variant_id = @variantId
          `);
        }
      }
      await new sql.Request(tx).input('orderId', orderId).query("UPDATE dbo.OrderPayments SET status = N'PAID', paid_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME() WHERE order_id = @orderId AND method = N'COD'");
    }
    await new sql.Request(tx).input('orderId', orderId).input('status', status).query('UPDATE dbo.Orders SET status = @status, updated_at = SYSUTCDATETIME() WHERE id = @orderId');
    await tx.commit();
    return getOrder(0, orderId, true);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function adminInventory() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT v.id AS variant_id, v.sku, v.variant_name, p.id AS product_id, p.product_name,
      i.on_hand, i.reserved, i.available
    FROM dbo.ProductVariants v
    JOIN dbo.Products p ON p.id = v.product_id
    JOIN dbo.Inventory i ON i.variant_id = v.id
    ORDER BY p.product_name, v.id
  `);
  return result.recordset;
}
