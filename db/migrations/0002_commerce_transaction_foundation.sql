IF OBJECT_ID(N'dbo.UserAddresses', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.UserAddresses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    recipient_name NVARCHAR(120) NOT NULL,
    phone NVARCHAR(30) NOT NULL,
    address_line NVARCHAR(255) NOT NULL,
    ward NVARCHAR(120) NOT NULL,
    district NVARCHAR(120) NOT NULL,
    province_city NVARCHAR(120) NOT NULL,
    postal_code NVARCHAR(20) NULL,
    is_default BIT NOT NULL CONSTRAINT DF_UserAddresses_IsDefault DEFAULT 0,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_UserAddresses_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_UserAddresses_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(id)
  );
  CREATE INDEX IX_UserAddresses_User ON dbo.UserAddresses(user_id);
END;
GO

IF OBJECT_ID(N'dbo.Carts', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Carts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    status NVARCHAR(20) NOT NULL CONSTRAINT DF_Carts_Status DEFAULT N'active',
    created_at DATETIME2 NOT NULL CONSTRAINT DF_Carts_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_Carts_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Carts_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(id),
    CONSTRAINT CK_Carts_Status CHECK (status IN (N'active', N'ordered', N'abandoned'))
  );
  CREATE UNIQUE INDEX UX_Carts_User_Active ON dbo.Carts(user_id) WHERE status = N'active';
END;
GO

IF OBJECT_ID(N'dbo.CartItems', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CartItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cart_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_CartItems_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_CartItems_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_CartItems_Carts FOREIGN KEY (cart_id) REFERENCES dbo.Carts(id) ON DELETE CASCADE,
    CONSTRAINT FK_CartItems_ProductVariants FOREIGN KEY (variant_id) REFERENCES dbo.ProductVariants(id),
    CONSTRAINT CK_CartItems_Quantity CHECK (quantity > 0)
  );
  CREATE UNIQUE INDEX UX_CartItems_Cart_Variant ON dbo.CartItems(cart_id, variant_id);
END;
GO

IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_number NVARCHAR(40) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    status NVARCHAR(30) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_total DECIMAL(12,2) NOT NULL CONSTRAINT DF_Orders_Discount DEFAULT 0,
    shipping_fee DECIMAL(12,2) NOT NULL CONSTRAINT DF_Orders_Shipping DEFAULT 0,
    grand_total DECIMAL(12,2) NOT NULL,
    currency NVARCHAR(10) NOT NULL CONSTRAINT DF_Orders_Currency DEFAULT N'USD',
    recipient_name NVARCHAR(120) NOT NULL,
    phone NVARCHAR(30) NOT NULL,
    address_line NVARCHAR(255) NOT NULL,
    ward NVARCHAR(120) NOT NULL,
    district NVARCHAR(120) NOT NULL,
    province_city NVARCHAR(120) NOT NULL,
    postal_code NVARCHAR(20) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_Orders_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Orders_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(id),
    CONSTRAINT CK_Orders_Status CHECK (status IN (N'PENDING', N'CONFIRMED', N'PROCESSING', N'SHIPPED', N'DELIVERED', N'CANCELLED'))
  );
  CREATE INDEX IX_Orders_User_Created ON dbo.Orders(user_id, created_at DESC);
  CREATE INDEX IX_Orders_Status ON dbo.Orders(status);
END;
GO

IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.OrderItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NULL,
    variant_id INT NULL,
    product_name_snapshot NVARCHAR(255) NOT NULL,
    variant_name_snapshot NVARCHAR(120) NULL,
    sku_snapshot NVARCHAR(100) NOT NULL,
    options_snapshot NVARCHAR(MAX) NULL,
    unit_price_snapshot DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    image_url_snapshot NVARCHAR(500) NULL,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (order_id) REFERENCES dbo.Orders(id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Products FOREIGN KEY (product_id) REFERENCES dbo.Products(id),
    CONSTRAINT FK_OrderItems_ProductVariants FOREIGN KEY (variant_id) REFERENCES dbo.ProductVariants(id),
    CONSTRAINT CK_OrderItems_Quantity CHECK (quantity > 0)
  );
  CREATE INDEX IX_OrderItems_Order ON dbo.OrderItems(order_id);
END;
GO

IF OBJECT_ID(N'dbo.OrderPayments', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.OrderPayments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    method NVARCHAR(20) NOT NULL,
    provider NVARCHAR(50) NULL,
    status NVARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    provider_reference NVARCHAR(255) NULL,
    provider_transaction_id NVARCHAR(255) NULL,
    paid_at DATETIME2 NULL,
    failed_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_OrderPayments_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_OrderPayments_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_OrderPayments_Orders FOREIGN KEY (order_id) REFERENCES dbo.Orders(id) ON DELETE CASCADE,
    CONSTRAINT CK_OrderPayments_Method CHECK (method IN (N'COD', N'ONLINE')),
    CONSTRAINT CK_OrderPayments_Status CHECK (status IN (N'UNPAID', N'PENDING', N'PAID', N'FAILED', N'REFUNDED'))
  );
  CREATE INDEX IX_OrderPayments_Order ON dbo.OrderPayments(order_id);
END;
GO
