#!/usr/bin/env node
/* Reads produtos.json, enriches each product with realistic `technical_specs` and `descricao`
   inferred from the product NAME (mamadeira/chupeta/copo/etc.), and writes back to produtos.json.
*/
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.resolve(__dirname, '..', 'produtos.json');
const items = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

const COMMON = {
  observacoes: 'Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO',
};

function detectVolume(nome) {
  const m = String(nome).match(/(\d{2,4})\s*ml/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

function detectColor(nome) {
  const n = nome.toLowerCase();
  if (n.includes('rosa')) return 'Rosa';
  if (n.includes('azul')) return 'Azul';
  if (n.includes('cristal')) return 'Cristal';
  if (n.includes('verde')) return 'Verde';
  if (n.includes('amarel')) return 'Amarelo';
  if (n.includes('branc')) return 'Branco';
  return 'Variadas';
}

function specsMamadeira(nome) {
  const vol = detectVolume(nome) || (nome.match(/240/) ? 240 : nome.match(/140/) ? 140 : nome.match(/60/) ? 60 : 240);
  const bico = /silicone/i.test(nome) ? 'Silicone' : /pvc/i.test(nome) ? 'PVC' : /cristal/i.test(nome) ? 'Cristal' : 'Silicone';
  const idade = vol <= 60 ? '0-3 meses' : vol <= 140 ? '0-6 meses' : '6 meses +';
  const peso = vol <= 60 ? 80 : vol <= 140 ? 110 : vol <= 240 ? 140 : 160;
  const altura = vol <= 60 ? 12 : vol <= 140 ? 16 : vol <= 240 ? 18 : 19;
  const diam = vol <= 60 ? 4 : 5;
  return {
    tipo: 'Mamadeira',
    capacidade_ml: vol,
    bico,
    material: 'Polipropileno (PP)',
    idade,
    peso_g: peso,
    dimensoes_cm: `${altura} × ${diam} × ${diam}`,
    cor: detectColor(nome),
    ...COMMON,
  };
}

function specsChupeta(nome) {
  const bico = /ortodontic/i.test(nome) ? 'Ortodôntico' : /borboleta/i.test(nome) ? 'Borboleta' : /redondo/i.test(nome) ? 'Redondo' : 'Ortodôntico';
  const idade = /t2|6m\+|6\+/i.test(nome) ? '6 meses +' : '0-6 meses';
  const ventilada = /ventilada/i.test(nome) ? 'Sim' : 'Não';
  return {
    tipo: 'Chupeta',
    bico,
    material: 'PP + Silicone medicinal',
    idade,
    peso_g: 15,
    dimensoes_cm: '6 × 4 × 3',
    ventilada,
    cor: detectColor(nome),
    ...COMMON,
  };
}

function specsCopo(nome) {
  const alca = /al[çc]a/i.test(nome) ? 'Sim' : 'Não';
  const vol = detectVolume(nome) || 270;
  return {
    tipo: /caneca/i.test(nome) ? 'Caneca de treinamento' : 'Copo de treinamento',
    capacidade_ml: vol,
    bico: 'Silicone antivazamento',
    material: 'Polipropileno (PP)',
    idade: '6 meses +',
    peso_g: 100,
    dimensoes_cm: '14 × 8 × 8',
    alca,
    cor: detectColor(nome),
    ...COMMON,
  };
}

function specsPrendedor() {
  return {
    tipo: 'Prendedor de chupeta',
    material: 'PP + Silicone',
    comprimento_cm: 22,
    peso_g: 12,
    fechamento: 'Mola',
    ...COMMON,
  };
}

function specsEscovaMamadeira() {
  return {
    tipo: 'Escova para mamadeira',
    material: 'PP + Nylon',
    comprimento_cm: 30,
    peso_g: 35,
    ...COMMON,
  };
}

function specsGenerico(nome, fam) {
  return {
    tipo: 'Acessório',
    material: 'Polipropileno (PP)',
    peso_g: 30,
    linha: fam || '—',
    ...COMMON,
  };
}

function buildSpecs(p) {
  const n = (p.nome || '').toLowerCase();
  if (n.includes('mamadeira')) return specsMamadeira(p.nome);
  if (n.includes('chupeta')) return specsChupeta(p.nome);
  if (n.includes('copo') || n.includes('caneca')) return specsCopo(p.nome);
  if (n.includes('prendedor')) return specsPrendedor();
  if (n.includes('escova') && n.includes('mamadeira')) return specsEscovaMamadeira();
  return specsGenerico(p.nome, p.linha);
}

function buildDesc(p, specs) {
  const nome = p.nome || 'Produto';
  const linha = p.linha ? p.linha.replace(/-/g, ' ') : '';
  const tipo = (specs.tipo || '').toLowerCase();
  if (tipo.includes('mamadeira')) {
    return `${nome} da linha ${linha}, com capacidade de ${specs.capacidade_ml} ml e bico ${String(specs.bico).toLowerCase()}. Indicada para a faixa etária ${specs.idade}, é fabricada em ${specs.material}, livre de BPA e ftalatos. Garante alimentação segura, prática e confortável para o bebê.`;
  }
  if (tipo.includes('chupeta')) {
    return `${nome} com bico ${String(specs.bico).toLowerCase()} em silicone medicinal, desenvolvida para bebês a partir de ${specs.idade}. Leve e atóxica, atende às normas do INMETRO e proporciona conforto e segurança nos momentos de relaxamento.`;
  }
  if (tipo.includes('copo') || tipo.includes('caneca')) {
    return `${nome} ideal para a fase de transição alimentar. Possui ${specs.capacidade_ml} ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de ${specs.idade}.`;
  }
  if (tipo.includes('prendedor')) {
    return `${nome} prático e seguro, com mola resistente e clipe em PP de qualidade. Mantém a chupeta sempre limpa e ao alcance do bebê, evitando quedas e perdas no dia a dia.`;
  }
  if (tipo.includes('escova')) {
    return `${nome} com cerdas em nylon macio que higienizam por completo o interior de mamadeiras e bicos. Cabo ergonômico em PP de fácil manuseio.`;
  }
  return `${nome} da linha ${linha}, desenvolvido em ${specs.material} de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.`;
}

let enriched = 0;
for (const p of items) {
  const specs = buildSpecs(p);
  const desc = buildDesc(p, specs);
  p.technical_specs = specs;
  p.descricao = desc;
  enriched++;
}

fs.writeFileSync(JSON_PATH, JSON.stringify(items, null, 2));
console.log(`Enriched ${enriched} products in ${JSON_PATH}`);
