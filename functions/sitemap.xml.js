export async function onRequest(context) {
  const res = await fetch('https://immogest1.fofefranklin57.workers.dev/sitemap.xml');
  const xml = await res.text();
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
