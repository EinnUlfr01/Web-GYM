import { getPool } from '../../config/database';
import { productScopes } from './product-ownership.service';

export interface ProductListResult {
  products: any[];
  page: number;
  limit: number;
  total: number;
}

export interface ProductListParams {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  saleOnly?: boolean;
  page: number;
  limit: number;
  sort?: string;
}

const displayVariantApply = `
CROSS APPLY (
  SELECT TOP (1)
    v.id, v.product_id, v.variant_name, v.sku, v.barcode, v.price, v.sale_price,
    CASE WHEN v.sale_price IS NOT NULL AND v.sale_price < v.price THEN v.sale_price ELSE v.price END AS effective_price,
    v.weight, v.is_active, v.is_default, i.available
  FROM dbo.ProductVariants v
  JOIN dbo.Inventory i ON i.variant_id = v.id
  WHERE v.product_id = p.id AND v.is_active = 1
  ORDER BY v.is_default DESC, CASE WHEN i.available > 0 THEN 0 ELSE 1 END, v.id
) dv`;

const joins = `
LEFT JOIN dbo.Brands b ON p.brand_id = b.id
LEFT JOIN dbo.Categories c ON p.category_id = c.id
JOIN dbo.Shops shop ON shop.id=p.shop_id
${displayVariantApply}
OUTER APPLY (
  SELECT TOP (1) pi.id, pi.image_url, pi.is_primary, pi.sort_order
  FROM dbo.ProductImages pi
  WHERE pi.product_id = p.id
  ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
) primary_image`;

function bindListParams(request: any, params: ProductListParams) {
  if (params.search) request.input('search', `%${params.search}%`);
  if (params.category) request.input('category', params.category);
  if (params.brand) request.input('brand', params.brand);
  if (params.minPrice !== undefined) request.input('minPrice', params.minPrice);
  if (params.maxPrice !== undefined) request.input('maxPrice', params.maxPrice);
}

function buildWhere(params: ProductListParams) {
  const clauses = [productScopes.public];
  if (params.search) clauses.push('(p.product_name LIKE @search OR b.name LIKE @search)');
  if (params.category) clauses.push('c.slug = @category');
  if (params.brand) clauses.push('b.slug = @brand');
  if (params.minPrice !== undefined) clauses.push('dv.effective_price >= @minPrice');
  if (params.maxPrice !== undefined) clauses.push('dv.effective_price <= @maxPrice');
  if (params.inStock) clauses.push('dv.available > 0');
  if (params.featured) clauses.push('p.is_featured = 1');
  if (params.saleOnly) clauses.push('dv.sale_price IS NOT NULL AND dv.sale_price < dv.price');
  return `WHERE ${clauses.join(' AND ')}`;
}

function mapProduct(row: any): any {
  const displayVariant = {
    id: row.variant_id,
    product_id: row.id,
    variant_name: row.variant_name,
    sku: row.variant_sku,
    barcode: row.variant_barcode ?? null,
    price: row.variant_price,
    sale_price: row.variant_sale_price ?? null,
    effective_price: row.effective_price,
    weight: row.variant_weight ?? null,
    is_active: Boolean(row.variant_is_active),
    available: row.variant_available,
    is_default: Boolean(row.variant_is_default),
    stock_status: row.variant_available <= 0 ? 'OUT_OF_STOCK' : row.variant_available <= 5 ? 'LOW_STOCK' : 'IN_STOCK',
    productId: row.id, variantName: row.variant_name, salePrice: row.variant_sale_price ?? null,
    effectivePrice: row.effective_price, isDefault: Boolean(row.variant_is_default),
    stockStatus: row.variant_available <= 0 ? 'OUT_OF_STOCK' : row.variant_available <= 5 ? 'LOW_STOCK' : 'IN_STOCK',
    options: []
  };
  const primaryImage = row.image_id == null ? null : {
    id: row.image_id,
    image_url: row.image_url,
    is_primary: Boolean(row.image_is_primary),
    sort_order: row.image_sort_order
  };
  return {
    id: row.id,
    product_name: row.product_name,
    slug: row.slug,
    description: row.description ?? null,
    short_description: row.short_description ?? row.description ?? null,
    specifications: row.specifications ?? null,
    brand: row.brand ?? null,
    brand_slug: row.brand_slug ?? null,
    category: row.category ?? null,
    category_slug: row.category_slug ?? null,
    shop: { id:Number(row.shop_id),name:row.shop_name,slug:row.shop_slug,isVerified:Boolean(row.shop_verified) },
    is_active: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
    is_on_sale: Boolean(row.is_on_sale),
    created_at: row.created_at,
    display_variant: displayVariant,
    primary_image: primaryImage,
    images: primaryImage ? [primaryImage] : [],
    // Temporary compatibility aliases; all are derived from canonical tables.
    price: displayVariant.price,
    sale_price: displayVariant.sale_price,
    stock: displayVariant.available,
    sku: displayVariant.sku,
    main_image: row.image_url ?? null,
    additional_images: null
  };
}

function attachImages(product: any, imageRows: any[]) {
  const images = imageRows.map((image: any) => ({
    id: image.id,
    image_url: image.image_url,
    is_primary: Boolean(image.is_primary),
    sort_order: image.sort_order
  }));
  product.images = images;
  product.primary_image = images[0] ?? null;
  product.main_image = images[0]?.image_url ?? null;
  product.additional_images = images
    .filter((image: any) => !image.is_primary)
    .map((image: any) => image.image_url)
    .join(',') || null;
  return product;
}

const productSelect = `
SELECT p.id, p.product_name, p.slug, p.description, p.description AS short_description,
  p.specifications, p.is_active, p.is_featured, p.is_on_sale, p.created_at,
  b.name AS brand, b.slug AS brand_slug, c.name AS category, c.slug AS category_slug,
  shop.id AS shop_id,shop.name AS shop_name,shop.slug AS shop_slug,shop.is_verified AS shop_verified,
  dv.id AS variant_id, dv.variant_name, dv.sku AS variant_sku, dv.barcode AS variant_barcode,
  dv.price AS variant_price, dv.sale_price AS variant_sale_price,
  dv.effective_price, dv.weight AS variant_weight, dv.is_active AS variant_is_active, dv.is_default AS variant_is_default,
  dv.available AS variant_available,
  primary_image.id AS image_id, primary_image.image_url,
  primary_image.is_primary AS image_is_primary, primary_image.sort_order AS image_sort_order
FROM dbo.Products p
${joins}`;

export const productsService = {
  async list(params: ProductListParams): Promise<ProductListResult> {
    const pool = await getPool();
    const where = buildWhere(params);
    let order = 'ORDER BY p.id DESC';
    if (params.sort === 'price_asc') order = 'ORDER BY dv.effective_price ASC, p.id ASC';
    else if (params.sort === 'price_desc') order = 'ORDER BY dv.effective_price DESC, p.id ASC';
    else if (params.sort === 'name') order = 'ORDER BY p.product_name ASC, p.id ASC';
    else if (params.sort === 'featured') order = 'ORDER BY p.is_featured DESC, p.id DESC';
    else if (params.sort === 'newest') order = 'ORDER BY p.created_at DESC, p.id DESC';
    else if (params.sort === 'sale') order = 'ORDER BY CASE WHEN dv.sale_price IS NOT NULL AND dv.sale_price < dv.price THEN 0 ELSE 1 END, dv.effective_price ASC, p.id ASC';

    const countRequest = pool.request();
    bindListParams(countRequest, params);
    const countResult = await countRequest.query(
      `SELECT COUNT(*) AS total FROM dbo.Products p ${joins} ${where}`
    );

    const dataRequest = pool.request();
    bindListParams(dataRequest, params);
    dataRequest.input('offset', (params.page - 1) * params.limit);
    dataRequest.input('limit', params.limit);
    const dataResult = await dataRequest.query(
      `${productSelect} ${where} ${order} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
    );

    const products = dataResult.recordset.map(mapProduct);
    if (products.length > 0) {
      const imageRequest = pool.request();
      const productIdParams = products.map((product: any, index: number) => {
        const name = `productId${index}`;
        imageRequest.input(name, product.id);
        return `@${name}`;
      });
      const imageResult = await imageRequest.query(`
        SELECT id, product_id, image_url, is_primary, sort_order
        FROM dbo.ProductImages
        WHERE product_id IN (${productIdParams.join(', ')})
        ORDER BY product_id, is_primary DESC, sort_order ASC, id ASC`);
      const imagesByProduct = new Map<number, any[]>();
      for (const image of imageResult.recordset) {
        const images = imagesByProduct.get(image.product_id) || [];
        images.push(image);
        imagesByProduct.set(image.product_id, images);
      }
      for (const product of products) attachImages(product, imagesByProduct.get(product.id) || []);
    }

    return {
      products,
      page: params.page,
      limit: params.limit,
      total: countResult.recordset[0].total
    };
  },

  async getBySlug(slug: string) {
    return this.getDetail('p.slug = @lookup', slug);
  },

  async getById(id: number) {
    return this.getDetail('p.id = @lookup', id);
  },

  async getDetail(predicate: string, lookup: string | number, includeInactive = false) {
    const pool = await getPool();
    const baseResult = await pool.request().input('lookup', lookup).query(
      `${productSelect} WHERE ${predicate}${includeInactive ? '' : ` AND p.is_active = 1 AND shop.status=N'ACTIVE'`}`
    );
    if (!baseResult.recordset[0]) {
      const unavailable=await pool.request().input('lookupFallback',lookup).query(`SELECT p.id,p.product_name,p.slug,p.description,p.description AS short_description,p.specifications,p.is_active,p.is_featured,p.is_on_sale,p.created_at,b.name AS brand,b.slug AS brand_slug,c.name AS category,c.slug AS category_slug,shop.id shop_id,shop.name shop_name,shop.slug shop_slug,shop.is_verified shop_verified FROM dbo.Products p LEFT JOIN dbo.Brands b ON b.id=p.brand_id LEFT JOIN dbo.Categories c ON c.id=p.category_id JOIN dbo.Shops shop ON shop.id=p.shop_id WHERE ${predicate.replace('@lookup','@lookupFallback')}${includeInactive?'':` AND p.is_active=1 AND shop.status=N'ACTIVE'`}`);
      const row=unavailable.recordset[0];
      if(!row)return null;
      return {...row,is_active:Boolean(row.is_active),is_featured:Boolean(row.is_featured),is_on_sale:Boolean(row.is_on_sale),shop:{id:Number(row.shop_id),name:row.shop_name,slug:row.shop_slug,isVerified:Boolean(row.shop_verified)},display_variant:null,variants:[],images:[],primary_image:null,main_image:null,additional_images:null};
    }

    const product = mapProduct(baseResult.recordset[0]);
    const productId = product.id;
    const [imagesResult, variantsResult, optionsResult] = await Promise.all([
      pool.request().input('productId', productId).query(`
        SELECT id, image_url, is_primary, sort_order
        FROM dbo.ProductImages
        WHERE product_id = @productId
        ORDER BY is_primary DESC, sort_order ASC, id ASC`),
      pool.request().input('productId', productId).query(`
        SELECT v.id, v.product_id, v.variant_name, v.sku, v.barcode, v.price, v.sale_price,
          CASE WHEN v.sale_price IS NOT NULL AND v.sale_price < v.price THEN v.sale_price ELSE v.price END AS effective_price,
          v.weight, v.is_active, v.is_default, i.available
        FROM dbo.ProductVariants v
        JOIN dbo.Inventory i ON i.variant_id = v.id
        WHERE v.product_id = @productId AND v.is_active = 1
        ORDER BY v.is_default DESC, CASE WHEN i.available > 0 THEN 0 ELSE 1 END, v.id`),
      pool.request().input('productId', productId).query(`
        SELECT vov.variant_id, po.id AS option_id, po.name AS option_name,
          pov.id AS value_id, pov.value
        FROM dbo.VariantOptionValues vov
        JOIN dbo.ProductVariants v ON v.id = vov.variant_id
        JOIN dbo.ProductOptions po ON po.id = vov.product_option_id
        JOIN dbo.ProductOptionValues pov
          ON pov.product_option_id = vov.product_option_id
         AND pov.id = vov.product_option_value_id
        WHERE v.product_id = @productId AND v.is_active = 1
        ORDER BY vov.variant_id, po.sort_order, po.id, pov.sort_order, pov.id`)
    ]);

    const optionsByVariant = new Map<number, any[]>();
    for (const option of optionsResult.recordset) {
      const options = optionsByVariant.get(option.variant_id) || [];
      options.push({
        option_id: option.option_id,
        option_name: option.option_name,
        value_id: option.value_id,
        value: option.value,
        optionId:option.option_id,
        optionName:option.option_name,
        valueId:option.value_id
      });
      optionsByVariant.set(option.variant_id, options);
    }
    const variants = variantsResult.recordset.map((variant: any) => ({
      ...variant,
      is_active: Boolean(variant.is_active),
      sale_price: variant.sale_price ?? null,
      barcode: variant.barcode ?? null,
      weight: variant.weight ?? null,
      is_default: Boolean(variant.is_default),
      stock_status: variant.available <= 0 ? 'OUT_OF_STOCK' : variant.available <= 5 ? 'LOW_STOCK' : 'IN_STOCK',
      productId:variant.product_id,variantName:variant.variant_name,salePrice:variant.sale_price??null,effectivePrice:variant.effective_price,isDefault:Boolean(variant.is_default),stockStatus:variant.available<=0?'OUT_OF_STOCK':variant.available<=5?'LOW_STOCK':'IN_STOCK',
      options: optionsByVariant.get(variant.id) || []
    }));
    const images = imagesResult.recordset.map((image: any) => ({
      ...image,
      is_primary: Boolean(image.is_primary)
    }));
    product.variants = variants;
    product.display_variant = variants.find((variant: any) => variant.id === product.display_variant.id);
    return attachImages(product, images);
  },

  async getFilters() {
    const pool = await getPool();
    const [categories, brands] = await Promise.all([
      pool.request().query('SELECT slug, name FROM dbo.Categories WHERE is_active = 1 ORDER BY name'),
      pool.request().query('SELECT id,slug,name,is_generic AS isGeneric FROM dbo.Brands WHERE is_active = 1 ORDER BY name')
    ]);
    return { categories: categories.recordset, brands: brands.recordset };
  }
};
