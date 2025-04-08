-- Create the pokemons table
CREATE TABLE pokemons (
    id INTEGER PRIMARY KEY,
    num VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    img VARCHAR(255),
    type TEXT[] NOT NULL,
    height VARCHAR(255),
    weight VARCHAR(255),
    candy VARCHAR(255),
    egg VARCHAR(255),
    multipliers NUMERIC[],
    weaknesses TEXT[] NOT NULL,
    spawn_chance NUMERIC NOT NULL,
    avg_spawns NUMERIC NOT NULL,
    spawn_time VARCHAR(255) NOT NULL,
    prev_evolution JSONB
);

-- Create indexes
CREATE INDEX idx_pokemon_num ON pokemons(num);
CREATE INDEX idx_pokemon_name ON pokemons(name);

-- Add RLS policies
ALTER TABLE pokemons ENABLE ROW LEVEL SECURITY;

-- Allow read access for all authenticated users
CREATE POLICY "Allow read access for all authenticated users"
ON pokemons FOR SELECT
TO authenticated
USING (true);

-- Allow full access for service_role
CREATE POLICY "Allow full access for service_role"
ON pokemons FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 