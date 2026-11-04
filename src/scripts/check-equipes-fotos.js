const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let serviceKey = '';

envFile.split('\n').forEach((l) => {
  const line = l.trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].replace(/['"]/g, '').trim();
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    serviceKey = line.split('=')[1].replace(/['"]/g, '').trim();
  }
});

async function main() {
  const res = await fetch(`${supabaseUrl}/rest/v1/equipes?select=id,nome,foto_base64&limit=100`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  const equipes = await res.json();
  console.log(`Total equipes no Supabase: ${equipes.length}`);
  const comFoto = equipes.filter((e) => e.foto_base64 && e.foto_base64.length > 50);
  console.log(`Equipes com foto_base64 preenchida: ${comFoto.length}`);

  equipes.forEach((e) => {
    const len = e.foto_base64 ? e.foto_base64.length : 0;
    console.log(`${e.id} | ${e.nome} | foto_len: ${len}`);
  });
}

main().catch(console.error);
