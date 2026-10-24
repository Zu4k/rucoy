// script1.js — Registro de BOSS

// ===== Configurações (ajuste aqui) =====
const RESPAWN_HORAS = 4;      // tempo até o boss voltar
const JANELA_MIN = 15;        // margem: pode vir -15 ou +15 minutos
const CHAVE = 'registroBoss_v1';

const BOSSES = [
  { id: 'Pumpkin',  nome: 'Wicked Pumpkin', img: 'img/puk.png',  cor: '#ff8a1f' },
  { id: 'LaCalaca', nome: 'La Calaca',       img: 'img/lac.png',  cor: '#c084fc' },
  
];
const GRUPOS = { N: 6, S: 8, E: 6, A: 4 };
const CORES = ['verde', 'azul', 'roxo', 'vermelho', 'amarelo', 'cinza']; // ciclo ao clicar

const MIN = 60000, HORA = 3600000;
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const hm = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const bossDe = id => BOSSES.find(b => b.id === id);

let bossAtual = BOSSES[0].id;
let filtro = 'todos';
let registros = [];   // { id, boss, server, morte, respawn }
const estados = {};   // estados[boss][server] = nome da cor ou 'laranja'

// ===== Persistência =====
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify({ registros, estados })); } catch (e) {}
}
function carregar() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE) || '{}');
    registros = d.registros || [];
    Object.assign(estados, d.estados || {});
  } catch (e) {}
  BOSSES.forEach(b => estados[b.id] = estados[b.id] || {});
}

// ===== Aviso =====
let toastT;
function aviso(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}

// ===== Abas e botões de servidor =====
function montarAbas() {
  $('abas').innerHTML = '';
  BOSSES.forEach(b => {
    const a = document.createElement('button');
    a.type = 'button'; a.className = 'aba'; a.textContent = b.nome; a.dataset.id = b.id;
    a.onclick = () => { bossAtual = b.id; desenharPainel(); };
    $('abas').appendChild(a);
  });
}

function desenharPainel() {
  const b = bossDe(bossAtual);
  document.querySelectorAll('.aba').forEach(a => a.classList.toggle('ativa', a.dataset.id === bossAtual));
  document.documentElement.style.setProperty('--cor-boss', b.cor);
  $('painel').style.setProperty('--img', `url('${b.img}')`);
  $('painelNome').textContent = b.nome;
  const g = $('grades'); g.innerHTML = '';
  Object.entries(GRUPOS).forEach(([letra, qtd]) => {
    const linha = document.createElement('div'); linha.className = 'linha';
    for (let i = 1; i <= qtd; i++) {
      const s = letra + i;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = s; btn.dataset.value = s;
      btn.className = 'server-btn ' + (estados[b.id][s] || '');
      btn.onclick = () => {
        const atual = estados[b.id][s];
        const prox = (!atual || atual === 'laranja') ? CORES[0] : CORES[(CORES.indexOf(atual) + 1) % CORES.length];
        estados[b.id][s] = prox;
        btn.className = 'server-btn pop ' + prox;
        salvar();
      };
      linha.appendChild(btn);
    }
    g.appendChild(linha);
  });
}

// ===== Registrar =====
function registrar() {
  const b = bossDe(bossAtual);
  const vermelhos = Object.keys(estados[b.id]).filter(s => estados[b.id][s] === 'vermelho');
  if (!vermelhos.length) { aviso('Nenhum servidor em vermelho neste boss. Clique no servidor até ficar vermelho.'); return; }

  let morte = Date.now();
  const h = $('hora').value;
  if (h) {
    const [hh, mm] = h.split(':').map(Number);
    const d = new Date(); d.setHours(hh, mm, 0, 0);
    if (d.getTime() > Date.now() + MIN) d.setDate(d.getDate() - 1); // hora de ontem
    morte = d.getTime();
  }
  vermelhos.forEach(s => {
    registros = registros.filter(r => !(r.boss === b.id && r.server === s)); // nova morte substitui a antiga
    registros.push({ id: `${b.id}-${s}-${Date.now()}`, boss: b.id, server: s, morte, respawn: morte + RESPAWN_HORAS * HORA });
    estados[b.id][s] = 'laranja';
  });
  $('hora').value = '';
  salvar(); desenharPainel(); desenharFila();
  aviso(`${vermelhos.length} registrado(s). Próximo às ${hm(morte + RESPAWN_HORAS * HORA)} (±${JANELA_MIN} min)`);
}

// ===== Fila da esquerda =====
function montarFiltros() {
  const f = $('filtros'); f.innerHTML = '';
  [{ id: 'todos', nome: 'Todos' }, ...BOSSES].forEach(b => {
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'chip' + (filtro === b.id ? ' ativo' : ''); c.textContent = b.nome;
    c.onclick = () => { filtro = b.id; montarFiltros(); desenharFila(); };
    f.appendChild(c);
  });
}

function desenharFila() {
  const lista = registros
    .filter(r => filtro === 'todos' || r.boss === filtro)
    .sort((a, b) => a.respawn - b.respawn);
  const ol = $('fila'); ol.innerHTML = '';
  $('vazio').classList.toggle('oculto', lista.length > 0);
  lista.forEach((r, i) => {
    const b = bossDe(r.boss);
    const li = document.createElement('li');
    li.className = 'item'; li.dataset.id = r.id; li.style.setProperty('--cor', b.cor);
    li.innerHTML = `
      <div class="pos">${i + 1}</div>
      <div class="info"><b>${r.server}</b><span class="boss">${b.nome}</span>
        <small>Morreu ${hm(r.morte)} · Janela ${hm(r.respawn - JANELA_MIN * MIN)} – ${hm(r.respawn + JANELA_MIN * MIN)}</small>
        <button type="button" class="x" title="Excluir registro feito errado">🗑 Excluir</button></div>
      <div class="tempo"></div>
      <div class="barra"></div>`;
    li.querySelector('.x').onclick = () => remover(r.id, li);
    ol.appendChild(li);
  });
  atualizar();
}

function remover(id, li) {
  li.classList.add('saindo');
  setTimeout(() => {
    const r = registros.find(x => x.id === id);
    registros = registros.filter(x => x.id !== id);
    if (r && estados[r.boss][r.server] === 'laranja') estados[r.boss][r.server] = '';
    salvar(); desenharPainel(); desenharFila();
  }, 280);
}

const fmt = ms => {
  const s = Math.floor(Math.abs(ms) / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
};

// Roda a cada segundo: contagem regressiva, status e relógio
function atualizar() {
  const agora = Date.now();
  $('relogio').textContent = new Date(agora).toLocaleTimeString('pt-BR');
  document.querySelectorAll('.item').forEach((li, i) => {
    const r = registros.find(x => x.id === li.dataset.id); if (!r) return;
    const abre = r.respawn - JANELA_MIN * MIN, fecha = r.respawn + JANELA_MIN * MIN;
    const st = agora < abre ? '' : agora <= fecha ? 'aberta' : 'atrasado';
    li.classList.toggle('aberta', st === 'aberta');
    li.classList.toggle('atrasado', st === 'atrasado');
    li.classList.toggle('primeiro', i === 0);
    const t = li.querySelector('.tempo');
    if (st === '') t.innerHTML = `${fmt(r.respawn - agora)}<small>nasce às ${hm(r.respawn)}</small>`;
    else if (st === 'aberta') t.innerHTML = `JANELA ABERTA<small>${agora < r.respawn ? 'faltam ' + fmt(r.respawn - agora) : 'passou ' + fmt(agora - r.respawn)}</small>`;
    else t.innerHTML = `ATRASADO<small>há ${fmt(agora - fecha)}</small>`;
    const pct = Math.min(100, Math.max(0, (agora - r.morte) / (r.respawn - r.morte) * 100));
    li.querySelector('.barra').style.width = pct + '%';
  });
}

// ===== Inicialização =====
$('registrarButton').onclick = registrar;
$('resetarButton').onclick = () => {
  Object.keys(estados[bossAtual]).forEach(s => { if (estados[bossAtual][s] !== 'laranja') delete estados[bossAtual][s]; });
  salvar(); desenharPainel();
};
$('limparButton').onclick = () => {
  if (!registros.length) return;
  if (confirm('Apagar todos os registros da fila?')) {
    registros = [];
    BOSSES.forEach(b => Object.keys(estados[b.id]).forEach(s => { if (estados[b.id][s] === 'laranja') delete estados[b.id][s]; }));
    salvar(); desenharPainel(); desenharFila();
  }
};

carregar(); montarAbas(); montarFiltros(); desenharPainel(); desenharFila();
setInterval(atualizar, 1000);
