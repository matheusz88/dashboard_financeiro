// ====== CHAVES DO LOCALSTORAGE ======
const KEY_TRANSACOES = "transacoes"; // onde salva as transações
const KEY_SESSAO = "usuarioLogado"; // guarda o usuário logado
const LOGIN_REDIRECT = "login.html"; // página de login

// ====== ELEMENTOS DOS CARDS ======
const elReceita = document.getElementById("cardReceita");
const elDespesa = document.getElementById("cardDespesa");
const elLucro = document.getElementById("cardLucro");
const elSaldo = document.getElementById("cardSaldo");

// Subtítulos (percentual comparado ao mês anterior)
const elSubReceita = document.getElementById("subReceita");
const elSubDespesa = document.getElementById("subDespesa");
const elSubLucro = document.getElementById("subLucro");
const elSubSaldo = document.getElementById("subSaldo");

// ====== FORMULÁRIO ======
const form = document.getElementById("formTransacao");
const inputTipo = document.getElementById("tipo");
const inputDesc = document.getElementById("descricao");
const inputCat = document.getElementById("categoria");
const inputValor = document.getElementById("valor");

// ====== TABELAS ======
const tbodyRecentes = document.getElementById("tbodyRecentes");
const emptyRecentes = document.getElementById("emptyRecentes");

// ====== BOTÕES ======
const btnSair = document.getElementById("btnSair");
const btnVerTodas = document.getElementById("btnVerTodas");

// ====== MODAL ======
const modalOverlay = document.getElementById("modalOverlay");
const btnFecharModal = document.getElementById("btnFecharModal");
const tbodyTodas = document.getElementById("tbodyTodas");
const emptyTodas = document.getElementById("emptyTodas");

// ====== CANVAS (GRÁFICO) ======
const canvas = document.getElementById("grafico");
const ctx = canvas.getContext("2d");

// ====== FORMATADOR DE MOEDA ======
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });


// ====== FUNÇÕES AUXILIARES ======

// Retorna data de hoje em formato ISO
function hojeISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

// Formata data para padrão brasileiro
function formatarDataBR(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Retorna chave do minuto (HH:MM)
function minutosKey(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Retorna chave do mês (YYYY-MM)
//function monthKey(iso) {
//  const d = new Date(iso);
//  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
//}

//// Nome do mês (ex: Mar/26)
//function monthLabel(key) {
//  const [y, m] = key.split("-");
//  const map = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
//  return `${map[Number(m)-1]}/${y.slice(2)}`;
//}

// Converte valor digitado para número
function parseValorNumero(value) {
  const s = String(value).trim().replace(".", "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

// Lê transações do localStorage
function lerTransacoes() {
  const raw = localStorage.getItem(KEY_TRANSACOES);
  return raw ? JSON.parse(raw) : [];
}

// Salva transações
function salvarTransacoes(lista) {
  localStorage.setItem(KEY_TRANSACOES, JSON.stringify(lista));
}

// Gera ID único
function gerarId() {
  return crypto?.randomUUID ? crypto.randomUUID() : Date.now() + Math.random();
}

// Define sinal (+ ou -) e cor
function sinalEValor(t) {
  const sign = t.tipo === "entrada" ? "+" : "-";
  const classes = t.tipo === "entrada" ? "money ok" : "money bad";
  return { valor: `${sign}${brl.format(t.valor)}`, classes };
}

// ====== SESSÃO ======
function checarSessao() {
  if (!localStorage.getItem(KEY_SESSAO)) {
    window.location.href = LOGIN_REDIRECT;
  }
}

// ====== CÁLCULOS ======
function somatorios(transacoes) {
  let receita = 0, despesa = 0;

  for (const t of transacoes) {
    if (t.tipo === "entrada") receita += t.valor;
    else despesa += t.valor;
  }

  return {
    receita,
    despesa,
    lucro: receita - despesa,
    saldo: receita - despesa
  };
}

function porMinuto(transacoes) {
  const map = new Map();

  for (const t of transacoes) {
    const key = minutosKey(t.dataISO);
    if (!map.has(key)) map.set(key, { receita: 0, despesa: 0 });

    const item = map.get(key);
    if (t.tipo === "entrada") item.receita += t.valor;
    else item.despesa += t.valor;
  }

  const minutos = Array.from(map.keys()).sort((a, b) => {
    return a.localeCompare(b);
  });

  return {
  minutosOrdenados: minutos,
  receitaPorMinutos: minutos.map(k => map.get(k).receita),
  despesaPorMinutos: minutos.map(k => map.get(k).despesa)
};
}
// ====== AGRUPAMENTO POR MÊS (GRÁFICO) ======çççççççççççççççççççççççççççççççççççççççççççççççççççççççççç
//function porMes(transacoes) {
//  const map = new Map();
//
//  for (const t of transacoes) {
//    const key = monthKey(t.dataISO);
//    if (!map.has(key)) map.set(key, { receita: 0, despesa: 0 });
//
//    const item = map.get(key);
//    if (t.tipo === "entrada") item.receita += t.valor;
//    else item.despesa += t.valor;
//  }
//
//  const meses = Array.from(map.keys()).sort();
//
//  return {
//    mesesOrdenados: meses,
//    receitaPorMes: meses.map(k => map.get(k).receita),
//    despesaPorMes: meses.map(k => map.get(k).despesa)
//  };
//}

function compararMinutosAtualAnterior(transacoes) {
  const agora = new Date();

  const atual = new Date(agora);
  const anterior = new Date(agora);
  anterior.setMinutes(agora.getMinutes() - 1);

  const keyAtual = minutosKey(atual.toISOString());
  const keyAnterior = minutosKey(anterior.toISOString());

  let rAtual = 0, dAtual = 0, rAnt = 0, dAnt = 0;

  for (const t of transacoes) {
    const key = minutosKey(t.dataISO);

    if (key === keyAtual) {
      t.tipo === "entrada" ? rAtual += t.valor : dAtual += t.valor;
    }

    if (key === keyAnterior) {
      t.tipo === "entrada" ? rAnt += t.valor : dAnt += t.valor;
    }
  }

  function pct(a, b) {
    if (b === 0) return 0;
    return ((a - b) / b) * 100;
  }

  return {
    receitaPct: pct(rAtual, rAnt),
    despesaPct: pct(dAtual, dAnt),
    lucroPct: pct(rAtual - dAtual, rAnt - dAnt),
    saldoPct: pct(rAtual - dAtual, rAnt - dAnt),
  };
}

// ====== COMPARAÇÃO COM MÊS ANTERIOR ======çççççççççççççççççççççççççççççççççççççççççççççççççççççç
//function compararMesAtualAnterior(transacoes) {
//  const hoje = new Date();
//
//  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}`;
//  const dAnterior = new Date(hoje.getFullYear(), hoje.getMonth()-1, 1);
//  const mesAnterior = `${dAnterior.getFullYear()}-${String(dAnterior.getMonth()+1).padStart(2,"0")}`;
//
//  let rAtual=0, dAtual=0, rAnt=0, dAnt=0;
//
//  for (const t of transacoes) {
//    const mk = monthKey(t.dataISO);
//
//    if (mk === mesAtual) {
//      t.tipo === "entrada" ? rAtual += t.valor : dAtual += t.valor;
//    }
//
//    if (mk === mesAnterior) {
//      t.tipo === "entrada" ? rAnt += t.valor : dAnt += t.valor;
//    }
//  }
//
//  function pct(a, b) {
//    if (b === 0) return 0;
//    return ((a - b) / b) * 100;
//  }
//
//  return {
//    receitaPct: pct(rAtual, rAnt),
//    despesaPct: pct(dAtual, dAnt),
//    lucroPct: pct(rAtual - dAtual, rAnt - dAnt),
//    saldoPct: pct(rAtual - dAtual, rAnt - dAnt),
//  };
//}

// ====== RENDERIZAÇÃO DOS CARDS ======
//function renderCards(transacoes) {
//  const { receita, despesa, lucro, saldo } = somatorios(transacoes);
//
//  elReceita.textContent = brl.format(receita);
//  elDespesa.textContent = brl.format(despesa);
//  elLucro.textContent = brl.format(lucro);
//  elSaldo.textContent = brl.format(saldo);
//
//  const p = compararMesAtualAnterior(transacoes);
//
//  elSubReceita.textContent = `${p.receitaPct.toFixed(1)}% vs mês anterior`;
//  elSubDespesa.textContent = `${p.despesaPct.toFixed(1)}% vs mês anterior`;
//  elSubLucro.textContent = `${p.lucroPct.toFixed(1)}% vs mês anterior`;
//  elSubSaldo.textContent = `${p.saldoPct.toFixed(1)}% vs mês anterior`;
//}

// ====== CRUD ======

// Adicionar transação
function adicionarTransacao(dados) {
  const t = {
    id: gerarId(),
    ...dados,
    dataISO: hojeISO()
  };

  transacoes.push(t);
  salvarTransacoes(transacoes);
  renderTudo();
}

// Remover
function removerTransacao(id) {
  transacoes = transacoes.filter(t => t.id !== id);
  salvarTransacoes(transacoes);
  renderTudo();
}

// Editar
function editarTransacao(id, campo, valorNovo) {
  const t = transacoes.find(t => t.id === id);
  if (!t) return;

  t[campo] = valorNovo;
  salvarTransacoes(transacoes);
  renderTudo(false);
}

// ====== MODAL ======
function abrirModal() {
  modalOverlay.classList.remove("hidden");
}

function fecharModal() {
  modalOverlay.classList.add("hidden");
}

// ====== RENDER GERAL ======
function renderTudo() {
  renderCards(transacoes);
  desenharGrafico(transacoes);
}

// ====== EVENTOS ======

// Submit do formulário
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const valor = parseValorNumero(inputValor.value);

  if (!inputDesc.value || !inputCat.value) {
    alert("Preencha tudo!");
    return;
  }

  if (!valor || valor <= 0) {
    alert("Valor inválido!");
    return;
  }

  adicionarTransacao({
    tipo: inputTipo.value,
    descricao: inputDesc.value,
    categoria: inputCat.value,
    valor
  });

  form.reset();
});

// Botões
btnVerTodas.addEventListener("click", abrirModal);
btnFecharModal.addEventListener("click", fecharModal);

// Logout
btnSair.addEventListener("click", () => {
  localStorage.removeItem(KEY_SESSAO);
  window.location.href = LOGIN_REDIRECT;
});

// ====== INICIALIZAÇÃO ======
checarSessao();
transacoes = lerTransacoes();
renderTudo();