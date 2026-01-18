"""Migration script to add e-commerce customer fields to orders table"""

import sqlalchemy
from database import engine

# SQL statements to add missing columns
sql_statements = [
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50) UNIQUE',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200)',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(200)',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50)',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line1 VARCHAR(500)',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line2 VARCHAR(500)',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(200)',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postcode VARCHAR(20)',
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100) DEFAULT 'United Kingdom'",
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_notes TEXT'
]

print('🔧 Adding missing e-commerce columns to orders table...\n')

with engine.connect() as conn:
    for sql in sql_statements:
        try:
            result = conn.execute(sqlalchemy.text(sql))
            conn.commit()
            # Extract column name from SQL
            col_name = sql.split('ADD COLUMN IF NOT EXISTS ')[1].split(' ')[0]
            print(f'✅ Added column: {col_name}')
        except Exception as e:
            col_name = sql.split('ADD COLUMN IF NOT EXISTS ')[1].split(' ')[0]
            print(f'⚠️ Column {col_name}: {str(e)[:50]}')

print('\n✨ Database schema update complete!')

# Verify the columns were added
print('\n🔍 Verification:')
inspector = sqlalchemy.inspect(engine)
columns = [col['name'] for col in inspector.get_columns('orders')]
new_cols = ['order_number', 'customer_name', 'customer_email', 'customer_phone',
            'shipping_address_line1', 'shipping_address_line2', 'shipping_city',
            'shipping_postcode', 'shipping_country', 'customer_notes']

all_present = True
for col in new_cols:
    if col in columns:
        print(f'✅ {col}')
    else:
        print(f'❌ {col} - MISSING')
        all_present = False

if all_present:
    print('\n🎉 All columns successfully added!')
else:
    print('\n⚠️ Some columns are still missing. Please check the errors above.')
