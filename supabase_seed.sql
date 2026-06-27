-- Run this in the Supabase SQL Editor to instantly seed your database

-- 1. Default Warehouse
INSERT INTO warehouses (name, location, is_active, created_at)
VALUES ('Main Warehouse', 'Head Office', true, now())
ON CONFLICT (name) DO NOTHING;

-- 2. Default Units
INSERT INTO units (name, symbol) VALUES 
  ('Piece', 'pcs'),
  ('Box', 'box'),
  ('Set', 'set'),
  ('Meter', 'm'),
  ('Kilogram', 'kg'),
  ('Litre', 'ltr')
ON CONFLICT (symbol) DO NOTHING;

-- 3. Default Categories
INSERT INTO categories (name, created_at) VALUES 
  ('Electronic Components', now()),
  ('Test & Measurement Equipment', now()),
  ('Power Supplies', now()),
  ('Cables & Connectors', now()),
  ('Tools & Accessories', now()),
  ('Spare Parts', now()),
  ('Finished Products', now())
ON CONFLICT (name) DO NOTHING;

-- 4. Admin Role Permissions
INSERT INTO role_permissions (role, permission, created_at)
SELECT 'admin', unnest(ARRAY[
  'users:read', 'users:write', 'users:delete',
  'products:read', 'products:write', 'products:delete',
  'inventory:read', 'inventory:write', 'inventory:delete',
  'suppliers:read', 'suppliers:write', 'suppliers:delete',
  'purchasing:read', 'purchasing:write', 'purchasing:delete',
  'customers:read', 'customers:write', 'customers:delete',
  'sales:read', 'sales:write', 'sales:delete',
  'finance:read', 'finance:write', 'finance:delete',
  'hr:read', 'hr:write', 'hr:delete',
  'reports:read', 'reports:write', 'reports:delete',
  'settings:read', 'settings:write', 'settings:delete',
  'service:read', 'service:write', 'service:delete'
]), now()
ON CONFLICT (role, permission) DO NOTHING;

-- 5. Manager Role Permissions
INSERT INTO role_permissions (role, permission, created_at)
SELECT 'manager', unnest(ARRAY[
  'users:read', 'hr:read', 'reports:read',
  'products:read', 'products:write', 'products:delete',
  'inventory:read', 'inventory:write', 'inventory:delete',
  'suppliers:read', 'suppliers:write', 'suppliers:delete',
  'purchasing:read', 'purchasing:write', 'purchasing:delete',
  'customers:read', 'customers:write', 'customers:delete',
  'sales:read', 'sales:write', 'sales:delete',
  'finance:read', 'finance:write', 'finance:delete',
  'service:read', 'service:write', 'service:delete'
]), now()
ON CONFLICT (role, permission) DO NOTHING;

-- 6. Employee Role Permissions
INSERT INTO role_permissions (role, permission, created_at)
SELECT 'employee', unnest(ARRAY[
  'products:read', 'inventory:read', 'customers:read', 'sales:read', 'service:read',
  'sales:write', 'service:write'
]), now()
ON CONFLICT (role, permission) DO NOTHING;
