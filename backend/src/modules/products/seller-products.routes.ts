import { Router } from 'express';import{authenticate,authorize}from'../../middleware/auth';import{validate}from'../../middleware/validate';import{UserRole}from'../../types';import{sellerProductsService}from'./seller-products.service';import{sellerProductIdSchema,sellerProductListSchema}from'./seller-products.validation';
const router=Router();router.use(authenticate,authorize(UserRole.SELLER));
router.get('/',validate(sellerProductListSchema,'query'),async(req,res,next)=>{try{const r=await sellerProductsService.list(req.user!.userId,req.query as any);res.json({success:true,data:r.items,shop:r.shop,pagination:{page:r.page,limit:r.limit,total:r.total,pages:Math.ceil(r.total/r.limit)}});}catch(e){next(e);}});
router.get('/:productId',validate(sellerProductIdSchema,'params'),async(req,res,next)=>{try{res.json({success:true,data:await sellerProductsService.detail(req.user!.userId,Number(req.params.productId))});}catch(e){next(e);}});
export default router;
