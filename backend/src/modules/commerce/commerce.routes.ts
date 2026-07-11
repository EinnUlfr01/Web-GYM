import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { UserRole } from '../../types';
import { sendSuccess } from '../../utils/response';
import {
  addCartItem,
  adminInventory,
  adminListOrders,
  cancelOrder,
  createAddress,
  deleteAddress,
  getCart,
  getOrder,
  listAddresses,
  listOrders,
  mergeCart,
  placeOrder,
  previewCheckout,
  removeCartItem,
  setDefaultAddress,
  updateAddress,
  updateCartItem,
  updateOrderStatus
} from './commerce.service';

const cartRouter = Router();
const addressRouter = Router();
const checkoutRouter = Router();
const orderRouter = Router();
const adminRouter = Router();

const cartItemSchema = z.object({
  variant_id: z.number().int().positive(),
  quantity: z.number().int().positive().max(99)
});

const cartQuantitySchema = z.object({
  quantity: z.number().int().min(0).max(99)
});

const mergeSchema = z.object({
  items: z.array(cartItemSchema).max(100)
});

const addressSchema = z.object({
  recipient_name: z.string().min(2).max(120),
  phone: z.string().min(5).max(30),
  address_line: z.string().min(5).max(255),
  ward: z.string().min(1).max(120),
  district: z.string().min(1).max(120),
  province_city: z.string().min(1).max(120),
  postal_code: z.string().max(20).optional().nullable(),
  is_default: z.boolean().optional()
});

const checkoutPreviewSchema = z.object({
  address_id: z.number().int().positive().optional()
});

const placeOrderSchema = z.object({
  address_id: z.number().int().positive()
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
});

function userId(req: Request) {
  return req.user!.userId;
}

function asyncHandler(fn: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

cartRouter.use(authenticate);
cartRouter.get('/', asyncHandler(async (req, res) => sendSuccess(res, await getCart(userId(req)))));
cartRouter.post('/items', validate(cartItemSchema), asyncHandler(async (req, res) => {
  sendSuccess(res, await addCartItem(userId(req), req.body), 'Cart item added', 201);
}));
cartRouter.patch('/items/:id', validate(cartQuantitySchema), asyncHandler(async (req, res) => {
  sendSuccess(res, await updateCartItem(userId(req), Number(req.params.id), req.body.quantity), 'Cart item updated');
}));
cartRouter.delete('/items/:id', asyncHandler(async (req, res) => {
  sendSuccess(res, await removeCartItem(userId(req), Number(req.params.id)), 'Cart item removed');
}));
cartRouter.post('/merge', validate(mergeSchema), asyncHandler(async (req, res) => {
  sendSuccess(res, await mergeCart(userId(req), req.body.items), 'Cart merged');
}));

addressRouter.use(authenticate);
addressRouter.get('/', asyncHandler(async (req, res) => sendSuccess(res, await listAddresses(userId(req)))));
addressRouter.post('/', validate(addressSchema), asyncHandler(async (req, res) => {
  sendSuccess(res, await createAddress(userId(req), req.body), 'Address created', 201);
}));
addressRouter.put('/:id', validate(addressSchema), asyncHandler(async (req, res) => {
  sendSuccess(res, await updateAddress(userId(req), Number(req.params.id), req.body), 'Address updated');
}));
addressRouter.delete('/:id', asyncHandler(async (req, res) => {
  await deleteAddress(userId(req), Number(req.params.id));
  sendSuccess(res, null, 'Address deleted');
}));
addressRouter.patch('/:id/default', asyncHandler(async (req, res) => {
  sendSuccess(res, await setDefaultAddress(userId(req), Number(req.params.id)), 'Default address updated');
}));

checkoutRouter.use(authenticate);
checkoutRouter.post('/preview', validate(checkoutPreviewSchema), asyncHandler(async (req, res) => {
  sendSuccess(res, await previewCheckout(userId(req), req.body.address_id));
}));
checkoutRouter.post('/place-order', validate(placeOrderSchema), asyncHandler(async (req, res) => {
  sendSuccess(res, await placeOrder(userId(req), req.body.address_id), 'Order placed', 201);
}));

orderRouter.use(authenticate);
orderRouter.get('/', asyncHandler(async (req, res) => sendSuccess(res, await listOrders(userId(req)))));
orderRouter.get('/:id', asyncHandler(async (req, res) => {
  sendSuccess(res, await getOrder(userId(req), Number(req.params.id)));
}));
orderRouter.post('/:id/cancel', asyncHandler(async (req, res) => {
  sendSuccess(res, await cancelOrder(userId(req), Number(req.params.id)), 'Order cancelled');
}));

adminRouter.use(authenticate, authorize(UserRole.ADMIN));
adminRouter.get('/orders', asyncHandler(async (_req, res) => sendSuccess(res, await adminListOrders())));
adminRouter.get('/orders/:id', asyncHandler(async (req, res) => {
  sendSuccess(res, await getOrder(0, Number(req.params.id), true));
}));
adminRouter.patch('/orders/:id/status', validate(statusSchema), asyncHandler(async (req, res) => {
  sendSuccess(res, await updateOrderStatus(Number(req.params.id), req.body.status), 'Order status updated');
}));
adminRouter.get('/inventory', asyncHandler(async (_req, res) => sendSuccess(res, await adminInventory())));

export { cartRouter, addressRouter, checkoutRouter, orderRouter, adminRouter };
