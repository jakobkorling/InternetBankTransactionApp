CREATE TABLE IF NOT EXISTS classifications (
    id SERIAL PRIMARY KEY,
    recipient VARCHAR(255) UNIQUE NOT NULL,
    classification VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL
);

INSERT INTO classifications (recipient, classification)
VALUES
    ('ICA', 'Food'),
    ('Skanetrafiken', 'Transport'),
    ('Netflix', 'Entertainment'),
    ('Holy Greens', 'Food'),
    ('IKEA', 'Household'),
    ('Tivoli', 'Entertainment')
ON CONFLICT (recipient) DO NOTHING;

INSERT INTO transactions (date, recipient, amount)
VALUES
    ('2026-09-01', 'ICA', -350),
    ('2026-09-02', 'Skanetrafiken', -120),
    ('2026-09-03', 'Netflix', -149),
    ('2026-09-03', 'Holy Greens', -95),
    ('2026-09-05', 'Skanetrafiken', -47),
    ('2026-09-05', 'IKEA', -450),
    ('2026-09-02', 'Tivoli', -299),
    ('2026-09-07', 'Employer', 32000),
    ('2026-09-08', 'Espresso House', -75);