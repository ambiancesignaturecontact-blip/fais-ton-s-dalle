// ─── Injecte des données structurées JSON-LD dans une page ──────
//
// À utiliser dans les composants/pages serveur :
//   <JsonLd data={breadcrumbJsonLd([...])} />
// Plusieurs objets peuvent être passés dans le tableau `items`.

export function JsonLd({
  data,
  items,
}: {
  data?: object;
  items?: object[];
}) {
  const all = [...(items ?? []), ...(data ? [data] : [])];
  if (all.length === 0) return null;
  return (
    <>
      {all.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Contenu généré par nos soins (jamais de saisie utilisateur
          // non échappée) ; JSON.stringify gère l'échappement de base.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(obj).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
