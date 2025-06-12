-- Create products table with all columns including expiry_date
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    barcode TEXT UNIQUE,
    category TEXT,
    expiry_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table with all required columns
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    total_amount REAL NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_mode TEXT NOT NULL DEFAULT 'cash'
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
);
-- Sample data for products
INSERT OR IGNORE INTO products (name, price, stock, barcode, category, expiry_date) VALUES
('Rice (1kg)', 45.00, 100, '8901234567890', 'Grocery', '2024-12-31'),
('Wheat Flour (1kg)', 30.00, 80, '8901234567891', 'Grocery', '2024-10-31'),
('Sugar (1kg)', 42.00, 60, '8901234567892', 'Grocery', '2025-06-30'),
('Toothpaste', 75.00, 50, '8901234567893', 'Personal Care', '2025-03-31'),
('Soap', 25.00, 120, '8901234567894', 'Personal Care', '2024-09-30'),
('Shampoo', 180.00, 40, '8901234567895', 'Personal Care', '2025-01-31'),
('Biscuits', 10.00, 200, '8901234567896', 'Snacks', '2024-08-31'),
('Chips', 20.00, 150, '8901234567897', 'Snacks', '2024-07-31');