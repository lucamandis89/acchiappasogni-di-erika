-- Non eseguito. Verificare schema, permessi/RLS, colonne e vincoli remoti prima dell'uso.
-- Nessun ON CONFLICT: non si presume un vincolo UNIQUE non verificato.
BEGIN;
LOCK TABLE public.categories IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO public.categories (name, slug, active, "order")
SELECT s.name, s.slug, true, s.ord
FROM (VALUES
 ('Classici','classici',0),('Bomboniere','bomboniere',1),
 ('Portachiavi','portachiavi',2),('Personalizzati','personalizzati',3),
 ('Pezzi unici','pezzi-unici',4),('Fiocchi nascita','fiocchi-nascita',5),
 ('Braccialetti','braccialetti',6),('Penne','penne',7)
) AS s(name,slug,ord)
WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE lower(c.name)=lower(s.name) OR c.slug=s.slug);
COMMIT;
