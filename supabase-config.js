// Coordonnees du projet Supabase de Top Set.
//
// Ces deux valeurs sont PUBLIQUES par conception. Elles partent dans le
// navigateur de chaque visiteur : les cacher serait un theatre, pas une
// securite. Ce qui protege reellement les donnees, c'est le Row Level
// Security defini dans supabase/schema.sql — chaque requete est filtree par
// la base sur auth.uid(), et un visiteur non connecte n'obtient rien.
//
// Ce qui ne doit JAMAIS figurer ici, ni nulle part dans ce depot :
//   · la cle service_role (ou « secret » / sb_secret_…), qui contourne RLS ;
//   · le mot de passe de la base de donnees.
//
// Mettre TOPSET_SUPABASE a null desactive proprement toute la partie compte :
// l'app retombe en mode 100 % local, sans erreur et sans bouton mort.
window.TOPSET_SUPABASE = {
  url: 'https://sqfkllijmeuoosvgesqi.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZmtsbGlqbWV1b29zdmdlc3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3Nzc1NzEsImV4cCI6MjEwNDM1MzU3MX0.NHtpgCK_LnEuYsMSQwO-bh15p7EmmNxaTAnFrhHj9gY'
};
