-- Création de la fonction exec_sql pour exécuter du SQL brut
-- Cette fonction est utilisée par les scripts de migration

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
