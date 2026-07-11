DECLARE @constraintName SYSNAME;

SELECT @constraintName = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID(N'dbo.Orders')
  AND c.name = N'currency';

IF @constraintName IS NOT NULL
BEGIN
  DECLARE @dropSql NVARCHAR(MAX) = N'ALTER TABLE dbo.Orders DROP CONSTRAINT ' + QUOTENAME(@constraintName) + N';';
  EXEC sp_executesql @dropSql;
END;
GO

IF OBJECT_ID(N'dbo.Orders', N'U') IS NOT NULL
  ALTER TABLE dbo.Orders ADD CONSTRAINT DF_Orders_Currency DEFAULT N'VND' FOR currency;
GO
