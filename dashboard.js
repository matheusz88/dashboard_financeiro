// dashboard.js

// ====== CONFIG ======
const KEY_TRANSACOES = "transacoes";
const KEY_SESSAO = "usuarioLogado"; // do login que você já fez
const LOGIN_REDIRECT = "login.html"; // ou "index.html" se preferir

// ====== ELEMENTOS ======
const elReceita = document.getElementById("cardReceita");
const elDespesa = document.getElementById("cardDespesa");
const elLucro = document.getElementById("cardLucro");
const elSaldo = document.getElementById("cardSaldo");

const elSubReceita = document.getElementById("subReceita");
const elSubDespesa = document.getElementById("subDespesa");
const elSubLucro = document.getElementById("subLucro");
const elSubSaldo = document.getElementById("subSaldo");

const form = document.getElementById("formTransacao");
const inputTipo = document.getElementById("tipo");
const inputDesc = document.getElementById("descricao");
const inputCat = document.getElementById("categoria");
const inputValor = document.getElementById("valor");

const tbodyRecentes = document.getElementById("tbodyRecentes");
const emptyRecentes = document.getElementById("emptyRecentes");

const btnSair = document.getElementById("btnSair");
const btnVerTodas = document.getElementById("btnVerTodas");

const modalOverlay = document.getElementById("modalOverlay");
const btnFecharModal = document.getElementById("btnFecharModal");
const tbodyTodas = document.getElementById("tbodyTodas");
const emptyTodas = document.getElementById("emptyTodas");

const canvas = document.getElementById("grafico");
const ctx = canvas.getContext("2d");

// ====== HELPERS ======
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function hojeISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

function formatarDataBR(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function monthKey(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // YYYY-MM
}

function monthLabel(key) {
  // key: YYYY-MM
  const [y, m] = key.split("-");
  const map = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${map[Number(m) - 1]}/${y.slice(2)}`;
}

function parseValorNumero(value) {
  // aceita "1200.50" ou "1200,50"
  const s = String(value).trim().replace(".", "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function lerTransacoes() {
  const raw = localStorage.getItem(KEY_TRANSACOES);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function salvarTransacoes(lista) {
  localStorage.setItem(KEY_TRANSACOES, JSON.stringify(lista));
}

function gerarId() {
  return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + String(Math.random()).slice(2);
}

function sinalEValor(t) {
  // t.tipo: entrada/saida, t.valor: number (sempre positivo)
  const sign = t.tipo === "entrada" ? "+" : "-";
  const classes = t.tipo === "entrada" ? "money ok" : "money bad";
  const valor = `${sign}${brl.format(t.valor)}`;
  return { valor, classes };
}

// ====== SESSÃO (opcional, mas recomendado) ======
function checarSessao() {
  // Se você não quiser bloquear o dashboard, comente essa função e a chamada.
  const sessao = localStorage.getItem(KEY_SESSAO);
  if (!sessao) {
    // sem sessão, volta pro login
    window.location.href = LOGIN_REDIRECT;
  }
}

// ====== CÁLCULOS ======
function somatorios(transacoes) {
  let receita = 0;
  let despesa = 0;

  for (const t of transacoes) {
    if (t.tipo === "entrada") receita += t.valor;
    else despesa += t.valor;
  }

  const lucro = receita - despesa;
  const saldo = lucro; // começa em 0 e acumula pelo histórico (saldo = soma entradas - soma saídas)

  return { receita, despesa, lucro, saldo };
}

function porMes(transacoes) {
  // retorna { mesesOrdenados: [...], receitaPorMes: [...], despesaPorMes: [...] }
  const map = new Map();

  for (const t of transacoes) {
    const key = monthKey(t.dataISO);
    if (!map.has(key)) map.set(key, { receita: 0, despesa: 0 });

    const item = map.get(key);
    if (t.tipo === "entrada") item.receita += t.valor;
    else item.despesa += t.valor;
  }

  const mesesOrdenados = Array.from(map.keys()).sort();
  const receitaPorMes = mesesOrdenados.map(k => map.get(k).receita);
  const despesaPorMes = mesesOrdenados.map(k => map.get(k).despesa);

  return { mesesOrdenados, receitaPorMes, despesaPorMes };
}

function compararMesAtualAnterior(transacoes) {
  // percentuais simples vs mês anterior (base: total do mês anterior)
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}`;

  const dAnterior = new Date(hoje.getFullYear(), hoje.getMonth()-1, 1);
  const mesAnterior = `${dAnterior.getFullYear()}-${String(dAnterior.getMonth()+1).padStart(2,"0")}`;

  let rAtual=0, dAtual=0, rAnt=0, dAnt=0;

  for (const t of transacoes) {
    const mk = monthKey(t.dataISO);
    if (mk === mesAtual) {
      if (t.tipo === "entrada") rAtual += t.valor;
      else dAtual += t.valor;
    }
    if (mk === mesAnterior) {
      if (t.tipo === "entrada") rAnt += t.valor;
      else dAnt += t.valor;
    }
  }

  const lucroAtual = rAtual - dAtual;
  const lucroAnt = rAnt - dAnt;
  const saldoAtual = lucroAtual;
  const saldoAnt = lucroAnt;

  function pct(atual, ant) {
    if (ant === 0) return 0;
    return ((atual - ant) / ant) * 100;
  }

  return {
    receitaPct: pct(rAtual, rAnt),
    despesaPct: pct(dAtual, dAnt),
    lucroPct: pct(lucroAtual, lucroAnt),
    saldoPct: pct(saldoAtual, saldoAnt),
  };
}

// ====== RENDER: CARDS ======
function renderCards(transacoes) {
  const { receita, despesa, lucro, saldo } = somatorios(transacoes);
  elReceita.textContent = brl.format(receita);
  elDespesa.textContent = brl.format(despesa);
  elLucro.textContent = brl.format(lucro);
  elSaldo.textContent = brl.format(saldo);

  const p = compararMesAtualAnterior(transacoes);

  elSubReceita.textContent = `${p.receitaPct >= 0 ? "+" : ""}${p.receitaPct.toFixed(1)}% vs mês anterior`;
  elSubDespesa.textContent = `${p.despesaPct >= 0 ? "+" : ""}${p.despesaPct.toFixed(1)}% vs mês anterior`;
  elSubLucro.textContent = `${p.lucroPct >= 0 ? "+" : ""}${p.lucroPct.toFixed(1)}% vs mês anterior`;
  elSubSaldo.textContent = `${p.saldoPct >= 0 ? "+" : ""}${p.saldoPct.toFixed(1)}% vs mês anterior`;

  // cores coerentes: despesa pct positivo não é "bom", mas é o protótipo (verde/vermelho). Vamos manter simples:
  elSubReceita.className = "card-sub " + (p.receitaPct >= 0 ? "ok" : "bad");
  elSubDespesa.className = "card-sub " + (p.despesaPct <= 0 ? "ok" : "bad");
  elSubLucro.className = "card-sub " + (p.lucroPct >= 0 ? "ok" : "bad");
  elSubSaldo.className = "card-sub " + (p.saldoPct >= 0 ? "ok" : "bad");
}

// ====== RENDER: TABELAS (RECENTES + TODAS) ======
function criarLinhaTransacao(t, onDelete, onEdit) {
  const tr = document.createElement("tr");

  const tdDesc = document.createElement("td");
  tdDesc.className = "editable";
  tdDesc.textContent = t.descricao;
  tdDesc.title = "Clique para editar";

  const tdCat = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = "badge editable";
  badge.textContent = t.categoria;
  badge.title = "Clique para editar";
  tdCat.appendChild(badge);

  const tdData = document.createElement("td");
  tdData.textContent = formatarDataBR(t.dataISO);

  const tdValor = document.createElement("td");
  tdValor.className = "right";
  const sv = sinalEValor(t);
  const spanValor = document.createElement("span");
  spanValor.className = sv.classes;
  spanValor.textContent = sv.valor;
  tdValor.appendChild(spanValor);

  const tdAcoes = document.createElement("td");
  tdAcoes.className = "right";
  const btnDel = document.createElement("button");
  btnDel.className = "action-btn";
  btnDel.textContent = "Excluir";
  btnDel.addEventListener("click", () => onDelete(t.id));
  tdAcoes.appendChild(btnDel);

  // Inline edit
  tdDesc.addEventListener("click", () => iniciarEdicaoTexto(tdDesc, t, "descricao", onEdit));
  badge.addEventListener("click", () => iniciarEdicaoTexto(badge, t, "categoria", onEdit, true));

  tr.appendChild(tdDesc);
  tr.appendChild(tdCat);
  tr.appendChild(tdData);
  tr.appendChild(tdValor);
  tr.appendChild(tdAcoes);

  return tr;
}

function iniciarEdicaoTexto(el, t, campo, onEdit, isBadge = false) {
  // evita abrir duas edições
  if (el.dataset.editing === "1") return;
  el.dataset.editing = "1";

  const valorAtual = el.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = valorAtual;
  input.style.height = "34px";
  input.style.width = "100%";
  input.style.borderRadius = "10px";
  input.style.border = "1px solid #e2e8f0";
  input.style.padding = "0 10px";
  input.style.fontSize = "13px";
  input.style.fontWeight = isBadge ? "900" : "700";

  const original = el.innerHTML;
  el.innerHTML = "";
  el.appendChild(input);
  input.focus();
  input.select();

  function salvar() {
    const novo = input.value.trim();
    el.dataset.editing = "0";

    if (!novo) {
      // volta sem salvar
      el.innerHTML = original;
      return;
    }

    onEdit(t.id, campo, novo);

    // re-render do texto
    if (isBadge) {
      el.textContent = novo;
      el.className = "badge editable";
    } else {
      el.textContent = novo;
      el.className = "editable";
    }
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") salvar();
    if (e.key === "Escape") {
      el.dataset.editing = "0";
      el.innerHTML = original;
    }
  });

  input.addEventListener("blur", salvar);
}

function renderTabelaRecentes(transacoes) {
  tbodyRecentes.innerHTML = "";

  const ordenadas = [...transacoes].sort((a,b) => new Date(b.dataISO) - new Date(a.dataISO));
  const recentes = ordenadas.slice(0, 5);

  emptyRecentes.style.display = recentes.length ? "none" : "block";

  for (const t of recentes) {
    const tr = criarLinhaTransacao(
      t,
      (id) => removerTransacao(id),
      (id, campo, valor) => editarTransacao(id, campo, valor)
    );
    tbodyRecentes.appendChild(tr);
  }
}

function renderTabelaTodas(transacoes) {
  tbodyTodas.innerHTML = "";

  const ordenadas = [...transacoes].sort((a,b) => new Date(b.dataISO) - new Date(a.dataISO));
  emptyTodas.style.display = ordenadas.length ? "none" : "block";

  for (const t of ordenadas) {
    const tr = criarLinhaTransacao(
      t,
      (id) => removerTransacao(id),
      (id, campo, valor) => editarTransacao(id, campo, valor)
    );
    tbodyTodas.appendChild(tr);
  }
}

// ====== GRÁFICO (CANVAS, SEM BIBLIOTECA) ======
function limparCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function desenharGrafico(transacoes) {
  limparCanvas();

  const padding = 46;
  const w = canvas.width;
  const h = canvas.height;
  const innerW = w - padding*2;
  const innerH = h - padding*2;

  // box
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // dados por mês
  const { mesesOrdenados, receitaPorMes, despesaPorMes } = porMes(transacoes);

  // se não tiver dados, desenha eixo e 0
  const meses = mesesOrdenados.length ? mesesOrdenados : [];
  const labels = meses.map(monthLabel);

  const maxVal = Math.max(0, ...receitaPorMes, ...despesaPorMes);
  const top = maxVal === 0 ? 1 : maxVal * 1.15;

  // eixos
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;

  // Y axis
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, h - padding);
  ctx.stroke();

  // X axis
  ctx.beginPath();
  ctx.moveTo(padding, h - padding);
  ctx.lineTo(w - padding, h - padding);
  ctx.stroke();

  // grade + labels Y
  ctx.fillStyle = "#64748b";
  ctx.font = "12px system-ui";

  const ticks = 4;
  for (let i=0; i<=ticks; i++){
    const y = padding + (innerH * (i/ticks));
    const val = top * (1 - i/ticks);

    ctx.strokeStyle = "rgba(226,232,240,0.9)";
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.fillText(brl.format(val), 8, y + 4);
  }

  // se não tem pontos, escreve "Sem dados"
  if (mesesOrdenados.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui";
    ctx.fillText("Sem dados ainda. Adicione transações para ver o gráfico.", padding, padding + 18);
    return;
  }

  // X labels
  ctx.fillStyle = "#64748b";
  ctx.font = "12px system-ui";

  const n = labels.length;
  const stepX = n === 1 ? innerW : innerW / (n - 1);

  for (let i=0; i<n; i++){
    const x = padding + stepX*i;
    ctx.fillText(labels[i], x - 12, h - padding + 22);
  }

  // função de escala
  const xOf = (i) => padding + stepX*i;
  const yOf = (v) => padding + innerH * (1 - (v / top));

  // linhas (Receita = verde, Despesa = vermelho) — sem depender de CSS
  function drawLine(vals, strokeStyle){
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i=0; i<vals.length; i++){
      const x = xOf(i);
      const y = yOf(vals[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // pontos
    for (let i=0; i<vals.length; i++){
      const x = xOf(i);
      const y = yOf(vals[i]);
      ctx.fillStyle = strokeStyle;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI*2);
      ctx.fill();
    }
  }

  drawLine(receitaPorMes, "#16a34a");
  drawLine(despesaPorMes, "#ef4444");
}

// ====== CRUD ======
let transacoes = [];

function adicionarTransacao({ tipo, descricao, categoria, valor }) {
  const t = {
    id: gerarId(),
    tipo, // "entrada" | "saida"
    descricao,
    categoria,
    valor, // sempre positivo
    dataISO: hojeISO(), // automático
  };
  transacoes.push(t);
  salvarTransacoes(transacoes);
  renderTudo();
}

function removerTransacao(id) {
  transacoes = transacoes.filter(t => t.id !== id);
  salvarTransacoes(transacoes);
  renderTudo();
}

function editarTransacao(id, campo, valorNovo) {
  const idx = transacoes.findIndex(t => t.id === id);
  if (idx === -1) return;

  if (campo === "descricao") transacoes[idx].descricao = valorNovo;
  if (campo === "categoria") transacoes[idx].categoria = valorNovo;

  salvarTransacoes(transacoes);
  renderTudo(false); // evita fechar modal
}

// ====== MODAL ======
function abrirModal() {
  modalOverlay.classList.remove("hidden");
  renderTabelaTodas(transacoes);
}

function fecharModal() {
  modalOverlay.classList.add("hidden");
}

// ====== RENDER GERAL ======
function renderTudo(closeModal = true) {
  renderCards(transacoes);
  renderTabelaRecentes(transacoes);
  desenharGrafico(transacoes);

  if (!modalOverlay.classList.contains("hidden")) {
    renderTabelaTodas(transacoes);
  }

  if (closeModal) {
    // não fecha sozinho, só deixa atualizado
  }
}

// ====== EVENTOS ======
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = inputTipo.value;
  const descricao = inputDesc.value.trim();
  const categoria = inputCat.value.trim();
  const valorNum = parseValorNumero(inputValor.value);

  if (!descricao || !categoria) {
    alert("Preencha descrição e categoria.");
    return;
  }
  if (!Number.isFinite(valorNum) || valorNum <= 0) {
    alert("Informe um valor numérico válido maior que 0.");
    return;
  }

  adicionarTransacao({
    tipo,
    descricao,
    categoria,
    valor: Number(valorNum.toFixed(2)),
  });

  form.reset();
  inputTipo.value = "entrada";
});

btnVerTodas.addEventListener("click", abrirModal);
btnFecharModal.addEventListener("click", fecharModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) fecharModal();
});

btnSair.addEventListener("click", () => {
  // limpa sessão, mas mantém dados
  localStorage.removeItem(KEY_SESSAO);
  window.location.href = LOGIN_REDIRECT;
});

// ====== INIT ======
checarSessao(); // comente se não quiser exigir login
transacoes = lerTransacoes();
renderTudo();
