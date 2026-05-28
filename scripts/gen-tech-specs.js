#!/usr/bin/env node
/* Reads produtos.json, enriches each product with realistic `technical_specs` and `descricao`
   inferred from the product NAME (mamadeira/chupeta/copo/etc.), and writes back to produtos.json.
   Each product gets EXPLICIT altura_cm, comprimento_cm, largura_cm, peso_g fields.
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

function dimsMamadeira(vol) {
  if (vol <= 60)  return { altura_cm: 12, largura_cm: 4,   comprimento_cm: 4,   peso_g: 80 };
  if (vol <= 140) return { altura_cm: 16, largura_cm: 5,   comprimento_cm: 5,   peso_g: 110 };
  if (vol <= 240) return { altura_cm: 18, largura_cm: 6,   comprimento_cm: 6,   peso_g: 140 };
  return            { altura_cm: 19, largura_cm: 6.5, comprimento_cm: 6.5, peso_g: 150 };
}

function specsMamadeira(nome) {
  const vol = detectVolume(nome) || (nome.match(/240/) ? 240 : nome.match(/140/) ? 140 : nome.match(/60/) ? 60 : 240);
  const bico = /silicone/i.test(nome) ? 'Silicone' : /pvc/i.test(nome) ? 'PVC' : /cristal/i.test(nome) ? 'Cristal' : 'Silicone';
  const idade = vol <= 60 ? '0-3 meses' : vol <= 140 ? '0-6 meses' : '6 meses +';
  const d = dimsMamadeira(vol);
  return {
    tipo: 'Mamadeira',
    capacidade_ml: vol,
    bico,
    material: 'Polipropileno (PP)',
    idade,
    ...d,
    dimensoes_cm: `${d.altura_cm} × ${d.largura_cm} × ${d.comprimento_cm}`,
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
    altura_cm: 5,
    largura_cm: 4,
    comprimento_cm: 4,
    peso_g: 15,
    dimensoes_cm: '5 × 4 × 4',
    ventilada,
    cor: detectColor(nome),
    ...COMMON,
  };
}

function specsCopo(nome) {
  const alca = /al[çc]a/i.test(nome) ? 'Sim' : 'Não';
  const vol = detectVolume(nome) || 270;
  const larg = alca === 'Sim' ? 10 : 8;
  return {
    tipo: /caneca/i.test(nome) ? 'Caneca de treinamento' : 'Copo de treinamento',
    capacidade_ml: vol,
    bico: 'Silicone antivazamento',
    material: 'Polipropileno (PP)',
    idade: '6 meses +',
    altura_cm: 14,
    largura_cm: larg,
    comprimento_cm: 8,
    peso_g: 100,
    dimensoes_cm: `14 × ${larg} × 8`,
    alca,
    cor: detectColor(nome),
    ...COMMON,
  };
}

function specsPrendedor() {
  return {
    tipo: 'Prendedor de chupeta',
    material: 'PP + Silicone',
    altura_cm: 1,
    largura_cm: 2,
    comprimento_cm: 22,
    peso_g: 12,
    dimensoes_cm: '1 × 2 × 22',
    fechamento: 'Mola',
    ...COMMON,
  };
}

function specsEscovaMamadeira() {
  return {
    tipo: 'Escova para mamadeira',
    material: 'PP + Nylon',
    altura_cm: 4,
    largura_cm: 6,
    comprimento_cm: 30,
    peso_g: 25,
    dimensoes_cm: '4 × 6 × 30',
    ...COMMON,
  };
}

function specsGenerico(nome, fam) {
  return {
    tipo: 'Acessório',
    material: 'Polipropileno (PP)',
    altura_cm: 6,
    largura_cm: 5,
    comprimento_cm: 8,
    peso_g: 30,
    dimensoes_cm: '6 × 5 × 8',
    linha: fam || '—',
    ...COMMON,
  };
}

function buildSpecs(p) {
  const n = (p.nome || '').toLowerCase();
  if (n.includes('mamadeira') && n.includes('escova')) return specsEscovaMamadeira();
  if (n.includes('mamadeira')) return specsMamadeira(p.nome);
  if (n.includes('chupeta') && !n.includes('prendedor')) return specsChupeta(p.nome);
  if (n.includes('copo') || n.includes('caneca')) return specsCopo(p.nome);
  if (n.includes('prendedor')) return specsPrendedor();
  if (n.includes('escova')) return specsEscovaMamadeira();
  return specsGenerico(p.nome, p.linha);
}

function buildDesc(p, specs) {
  const nome = p.nome || 'Produto';
  const linha = p.linha ? p.linha.replace(/-/g, ' ') : '';
  const tipo = (specs.tipo || '').toLowerCase();
  if (tipo.includes('mamadeira') && !tipo.includes('escova')) {
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
