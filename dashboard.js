// ====== CHAVES DO LOCALSTORAGE ======
const KEY_TRANSACOES = "transacoes";
const KEY_SESSAO = "usuarioLogado";
const LOGIN_REDIRECT = "login.html";

// ====== ELEMENTOS DOS CARDS ======
const elReceita = document.getElementById("cardReceita");
const elDespesa = document.getElementById("cardDespesa");
const elLucro = document.getElementById("cardLucro");
const elSaldo = document.getElementById("cardSaldo");

const elSubReceita = document.getElementById("subReceita");
const elSubDespesa = document.getElementById("subDespesa");
const elSubLucro = document.getElementById("subLucro");
const elSubSaldo = document.getElementById("subSaldo");

// ====== FORM ======
const form = document.getElementById("formTransacao");
const inputTipo = document.getElementById("tipo");
const inputDesc = document.getElementById("descricao");
const inputCat = document.getElementById("categoria");
const inputValor = document.getElementById("valor");

// ====== BOTÕES ======
const btnSair = document.getElementById("btnSair");
const btnVerTodas = document.getElementById("btnVerTodas");

// ====== MODAL ======
const modalOverlay = document.getElementById("modalOverlay");
const btnFecharModal = document.getElementById("btnFecharModal");

// ====== CANVAS ======
const canvas = document.getElementById("grafico");
const ctx = canvas.getContext("2d");

// ====== FORMATADOR ======
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

// ====== AUX ======
function hojeISO() {
  return new Date().toISOString(); // ✅ CORRIGIDO
}

function minutosKey(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatarDataBR(iso) {
  const d = new Date(iso);

  return `${String(d.getDate()).padStart(2, "0")}/${
    String(d.getMonth()+1).padStart(2,"0")
  }/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${
    String(d.getMinutes()).padStart(2, "0")
  }`;
}

function parseValorNumero(value) {
  const s = String(value).trim().replace(".", "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function lerTransacoes() {
  const raw = localStorage.getItem(KEY_TRANSACOES);
  return raw ? JSON.parse(raw) : [];
}

function salvarTransacoes(lista) {
  localStorage.setItem(KEY_TRANSACOES, JSON.stringify(lista));
}

function gerarId() {
  return crypto?.randomUUID ? crypto.randomUUID() : Date.now() + Math.random();
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

    if (!map.has(key)) {
      map.set(key, { receita: 0, despesa: 0 });
    }

    const item = map.get(key);

    if (t.tipo === "entrada") item.receita += t.valor;
    else item.despesa += t.valor;
  }

  const minutos = [...map.keys()].sort();

  return {
    minutosOrdenados: minutos,
    receitaPorMinutos: minutos.map(k => map.get(k).receita),
    despesaPorMinutos: minutos.map(k => map.get(k).despesa)
  };
}

let grafico;

function desenharGrafico(transacoes) {
  const dados = porMinuto(transacoes);

  const labels = dados.minutosOrdenados;
  const receitas = dados.receitaPorMinutos;
  const despesas = dados.despesaPorMinutos;

  if (grafico) {
    grafico.destroy();
  }

  grafico = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Receita",
          data: receitas,
          borderColor: "green",
          backgroundColor: "green",
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: "Despesa",
          data: despesas,
          borderColor: "red",
          backgroundColor: "red",
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    tooltip: {
      callbacks: {
        title: function(context) {
          const minuto = context[0].label;

          // pega uma transação desse minuto pra mostrar data
          const t = transacoes.find(t => minutosKey(t.dataISO) === minuto);

          if (!t) return minuto;

          const d = new Date(t.dataISO);

          const dataFormatada = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
          const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

          return `${dataFormatada} ${hora}`;
        },

        label: function(context) {
          const minuto = context.label;

          const filtradas = transacoes.filter(t => {
            return minutosKey(t.dataISO) === minuto;
          });

          return filtradas.map(t => {
            return `${t.descricao} (${t.categoria}) - ${brl.format(t.valor)}`;
          });
        }
      }
    }
  });
}

function renderTabela(transacoes) {
  tbodyRecentes.innerHTML = "";

  if (transacoes.length === 0) {
    emptyRecentes.style.display = "block";
    return;
  }

  emptyRecentes.style.display = "none";

  transacoes.slice(-5).reverse().forEach(t => {
    const tr = document.createElement("tr");

    const data = formatarDataBR(t.dataISO);
    const sinal = t.tipo === "entrada" ? "+" : "-";

    tr.innerHTML = `
      <td>${t.descricao}</td>
      <td>${t.categoria}</td>
      <td>${data}</td>
      <td class="right">${sinal}${brl.format(t.valor)}</td>
    `;

    const tdAcoes = document.createElement("td");
    tdAcoes.classList.add("right");

    const btn = document.createElement("button");
    btn.textContent = "🗑️";

    btn.addEventListener("click", () => {
      removerTransacao(t.id);
    });

    tdAcoes.appendChild(btn);
    tr.appendChild(tdAcoes);

    tbodyRecentes.appendChild(tr);
  });
}

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

// ====== RENDER ======
function renderCards(transacoes) {
  const { receita, despesa, lucro, saldo } = somatorios(transacoes);

  elReceita.textContent = brl.format(receita);
  elDespesa.textContent = brl.format(despesa);
  elLucro.textContent = brl.format(lucro);
  elSaldo.textContent = brl.format(saldo);

  const p = compararMinutosAtualAnterior(transacoes);

  elSubReceita.textContent = `${p.receitaPct.toFixed(1)}% vs minuto anterior`;
  elSubDespesa.textContent = `${p.despesaPct.toFixed(1)}% vs minuto anterior`;
  elSubLucro.textContent = `${p.lucroPct.toFixed(1)}% vs minuto anterior`;
  elSubSaldo.textContent = `${p.saldoPct.toFixed(1)}% vs minuto anterior`;
}

function renderTudo() {
  renderCards(transacoes);
  desenharGrafico(transacoes);
  renderTabela(transacoes); // 👈 AQUI
}

// ====== CRUD ======
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

function removerTransacao(id) {
  transacoes = transacoes.filter(t => t.id !== id);
  salvarTransacoes(transacoes);
  renderTudo();
}

// ====== EVENTOS ======
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

btnSair.addEventListener("click", () => {
  localStorage.removeItem(KEY_SESSAO);
  window.location.href = LOGIN_REDIRECT;
});

// ====== INIT ======
checarSessao();
let transacoes = lerTransacoes();
renderTudo();

// 🔥 AUTO UPDATE (tempo real)
setInterval(() => {
  renderTudo();
}, 60000);