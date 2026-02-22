SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('price_type', 'price_value', 'price_info');
