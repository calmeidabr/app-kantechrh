const fs = require('fs');
const path = require('path');

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

const fotosDir = 'c:/Users/calme/OneDrive/Documentos/KAN/ARQUIVOS DO APP/FOTOS PERFIS';
const files = fs.readdirSync(fotosDir);

// Mapeamento manual e por aproximação para as equipes que faltam foto
const mapNameToFiles = {
  'Mundo Kan': ['kan_logo_header.png', '3.jpg'],
  'FILÓSOFOS': ['aristoteles.jpg'],
  'Liminha e artistas': ['artistas.webp'],
  'Kering': ['Kering-logo.svg.png'],
  'Médiuns': ['Divaldo_Franco.Es.png'],
  'Influenciadores': ['Antonio_Tabet_01_cropped.jpg'],
  'Memories': ['artistas.webp'],
  'Maria e Olga': ['maria.png'],
  'Tchan': ['artistas.webp'],
  'Anthropic': ['sam_altman.png', 'Alan_Turing_(1951).jpg'],
};

async function main() {
  const res = await fetch(`${supabaseUrl}/rest/v1/equipes?select=id,nome,foto_base64&limit=100`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  const equipes = await res.json();
  console.log(`Verificando ${equipes.length} equipes...`);

  let updatedCount = 0;

  for (const eq of equipes) {
    if (eq.foto_base64 && eq.foto_base64.length > 50) {
      continue; // Já tem foto no Supabase
    }

    console.log(`Equipe sem foto: ID ${eq.id} - ${eq.nome}`);
    const candidateFiles = mapNameToFiles[eq.nome] || [];
    let fileToUse = null;

    for (const cand of candidateFiles) {
      const fullPath = path.join(fotosDir, cand);
      if (fs.existsSync(fullPath)) {
        fileToUse = fullPath;
        break;
      }
    }

    if (!fileToUse) {
      // Buscar pelo primeiro arquivo que contenha parte do nome da equipe
      const normNome = eq.nome.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = files.find((f) => {
        const normF = f.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normF.includes(normNome) || normNome.includes(normF.replace(/png|jpg|webp/g, ''));
      });
      if (found) {
        fileToUse = path.join(fotosDir, found);
      }
    }

    if (fileToUse) {
      const ext = path.extname(fileToUse).replace('.', '').toLowerCase();
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const fileBuf = fs.readFileSync(fileToUse);
      // Converter para base64 puro (ou data-uri)
      const b64 = fileBuf.toString('base64');

      console.log(` -> Atualizando ID ${eq.id} (${eq.nome}) com imagem ${path.basename(fileToUse)} (${b64.length} chars)`);

      const patchRes = await fetch(`${supabaseUrl}/rest/v1/equipes?id=eq.${eq.id}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          foto_base64: b64,
        }),
      });

      if (patchRes.ok) {
        console.log(`    [OK] Atualizada com sucesso no Supabase!`);
        updatedCount++;
      } else {
        console.error(`    [ERRO] Falha ao atualizar: ${patchRes.status} ${patchRes.statusText}`);
      }
    } else {
      console.log(` -> Nenhuma imagem correspondente encontrada localmente para ${eq.nome}`);
    }
  }

  console.log(`\nFinalizado. Total de equipes atualizadas no Supabase: ${updatedCount}`);
}

main().catch(console.error);
