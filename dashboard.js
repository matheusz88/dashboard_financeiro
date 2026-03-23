// ====== CHAVES DO LOCALSTORAGE ======

// Aqui eu guardo os nomes das chaves usadas no localStorage para não precisar repetir texto no código inteiro.
const KEY_TRANSACOES = "transacoes";
const KEY_SESSAO = "usuarioLogado";
const KEY_SALDO_INICIAL = "saldoInicial";
const LOGIN_REDIRECT = "login.html";

// ====== ELEMENTOS DOS CARDS ======

// Aqui eu pego os elementos dos cards principais para atualizar os valores na tela.
const elReceita = document.getElementById("cardReceita");
const elDespesa = document.getElementById("cardDespesa");
const elLucro = document.getElementById("cardLucro");
const elSaldo = document.getElementById("cardSaldo");

// Aqui eu pego os subtítulos dos cards.
// No meu sistema eu optei por esconder esses subtítulos no CSS, mas deixei no HTML para não quebrar o JS.
const elSubReceita = document.getElementById("subReceita");
const elSubDespesa = document.getElementById("subDespesa");
const elSubLucro = document.getElementById("subLucro");
const elSubSaldo = document.getElementById("subSaldo");

// ====== ELEMENTOS DE TEXTO ======

// Aqui eu pego a saudação do usuário para trocar o texto automaticamente com base no usuário salvo no localStorage.
const elSaudacaoUsuario = document.getElementById("saudacaoUsuario");

// ====== MODAL DE SALDO INICIAL ======

// Aqui eu pego os elementos do modal que pede o saldo inicial do usuário.
const modalSaldo = document.getElementById("modalSaldo");
const inputSaldoInicial = document.getElementById("inputSaldoInicial");
const btnSalvarSaldo = document.getElementById("btnSalvarSaldo");

// ====== TABELAS ======

// Aqui eu pego os elementos da tabela de transações recentes e da tabela completa.
const tbodyRecentes = document.getElementById("tbodyRecentes");
const emptyRecentes = document.getElementById("emptyRecentes");
const tbodyTodas = document.getElementById("tbodyTodas");
const emptyTodas = document.getElementById("emptyTodas");

// ====== FORMULÁRIO ======

// Aqui eu pego os elementos do formulário para cadastrar uma transação nova.
const form = document.getElementById("formTransacao");
const inputTipo = document.getElementById("tipo");
const inputDesc = document.getElementById("descricao");
const inputCat = document.getElementById("categoria");
const inputValor = document.getElementById("valor");

// ====== BOTÕES ======

// Aqui eu pego os botões principais que eu uso no sistema.
const btnSair = document.getElementById("btnSair");
const btnVerTodas = document.getElementById("btnVerTodas");
const btnFecharModal = document.getElementById("btnFecharModal");

// ====== MODAL DE TODAS AS TRANSAÇÕES ======

// Aqui eu pego o overlay do modal para abrir e fechar a lista completa de transações.
const modalOverlay = document.getElementById("modalOverlay");

// ====== GRÁFICO ======

// Aqui eu pego o canvas do gráfico.
// Eu também verifico se ele existe antes de tentar usar o contexto.
const canvas = document.getElementById("grafico");
const ctx = canvas ? canvas.getContext("2d") : null;

// ====== FORMATADOR ======

// Aqui eu crio um formatador de moeda em real.
// Isso me ajuda a mostrar os valores no padrão brasileiro.
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

// ====== ESTADO DA APLICAÇÃO ======

// Aqui eu deixo a variável principal que guarda as transações carregadas do localStorage.
let transacoes = [];

// Aqui eu guardo a instância do gráfico para conseguir destruir e desenhar de novo quando necessário.
let grafico = null;

// ====== FUNÇÕES AUXILIARES ======

// Aqui eu gero a data atual em formato ISO.
// Eu uso isso para salvar a data e a hora exatas da transação.
function hojeISO() {
  return new Date().toISOString();
}

// Aqui eu transformo uma data ISO em uma chave de hora:minuto.
// Eu uso isso para agrupar as transações por minuto no gráfico.
function minutosKey(iso) {
  const d = new Date(iso);

  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Aqui eu formato a data para o padrão brasileiro.
// Eu faço isso porque fica mais fácil de entender e apresentar para o usuário.
function formatarDataBR(iso) {
  const d = new Date(iso);

  return `${String(d.getDate()).padStart(2, "0")}/${
    String(d.getMonth() + 1).padStart(2, "0")
  }/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${
    String(d.getMinutes()).padStart(2, "0")
  }`;
}

// Aqui eu converto o valor digitado para número.
// Eu trato ponto e vírgula porque o usuário pode digitar em formato brasileiro.
function parseValorNumero(value) {
  const s = String(value).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);

  return Number.isFinite(n) ? n : NaN;
}

// Aqui eu gero um identificador único para cada transação.
// Se o navegador suportar randomUUID, eu uso ele; se não, eu monto outro ID simples.
function gerarId() {
  return crypto?.randomUUID ? crypto.randomUUID() : Date.now() + Math.random();
}

// ====== LOCALSTORAGE ======

// Aqui eu leio a lista de transações salva no localStorage.
// Se não existir nada salvo ainda, eu retorno um array vazio.
function lerTransacoes() {
  const raw = localStorage.getItem(KEY_TRANSACOES);
  return raw ? JSON.parse(raw) : [];
}

// Aqui eu salvo a lista inteira de transações no localStorage.
function salvarTransacoes(lista) {
  localStorage.setItem(KEY_TRANSACOES, JSON.stringify(lista));
}

// Aqui eu leio o saldo inicial salvo.
// Se ainda não existir, eu retorno null para saber que preciso pedir esse valor para o usuário.
function lerSaldoInicial() {
  const raw = localStorage.getItem(KEY_SALDO_INICIAL);

  if (raw === null || raw === "") return null;

  const valor = Number(raw);
  return Number.isFinite(valor) ? valor : null;
}

// Aqui eu salvo o saldo inicial no localStorage.
function salvarSaldoInicial(valor) {
  localStorage.setItem(KEY_SALDO_INICIAL, String(valor));
}

// ====== SESSÃO ======

// Aqui eu verifico se existe usuário logado.
// Se não existir, eu redireciono para a página de login.
function checarSessao() {
  if (!localStorage.getItem(KEY_SESSAO)) {
    window.location.href = LOGIN_REDIRECT;
  }
}

// ====== SAUDAÇÃO ======

// Aqui eu monto a saudação do topo com o nome do usuário salvo no localStorage.
// Eu deixei essa função flexível porque o usuário pode estar salvo como texto simples ou como objeto JSON.
function renderSaudacaoUsuario() {
  const sessao = localStorage.getItem(KEY_SESSAO);

  if (!elSaudacaoUsuario) return;

  if (!sessao) {
    elSaudacaoUsuario.textContent = "Bem-vindo de volta!";
    return;
  }

  let usuario = null;

  try {
    usuario = JSON.parse(sessao);
  } catch {
    usuario = sessao;
  }

  const nome =
    typeof usuario === "object" && usuario !== null
      ? usuario.nome || usuario.name || usuario.usuario || usuario.username
      : usuario;

  if (nome && String(nome).trim()) {
    elSaudacaoUsuario.textContent = `Bem-vindo(a), ${String(nome).trim()}!`;
  } else {
    elSaudacaoUsuario.textContent = "Bem-vindo de volta!";
  }
}

// ====== MODAL DE SALDO INICIAL ======

// Aqui eu verifico se o usuário já definiu um saldo inicial.
// Se ainda não definiu, eu abro o modal obrigando ele a preencher.
function verificarSaldoInicial() {
  const saldo = lerSaldoInicial();

  if (!modalSaldo) return;

  if (saldo === null) {
    modalSaldo.style.display = "flex";
  } else {
    modalSaldo.style.display = "none";
  }
}

// ====== CÁLCULOS ======

// Aqui eu somo todas as entradas.
function calcularReceita(listaTransacoes) {
  let total = 0;

  for (const t of listaTransacoes) {
    if (t.tipo === "entrada") {
      total += t.valor;
    }
  }

  return total;
}

// Aqui eu somo todas as saídas.
function calcularDespesa(listaTransacoes) {
  let total = 0;

  for (const t of listaTransacoes) {
    if (t.tipo === "saida") {
      total += t.valor;
    }
  }

  return total;
}

// Aqui eu calculo o lucro líquido.
// No meu sistema, lucro significa receita menos despesa.
function calcularLucro(receita, despesa) {
  return receita - despesa;
}

// Aqui eu calculo o saldo atual.
// Diferente do lucro, o saldo usa o saldo inicial que a pessoa informou quando entrou no sistema pela primeira vez.
function calcularSaldoAtual(receita, despesa) {
  const saldoInicial = lerSaldoInicial() ?? 0;
  return saldoInicial + receita - despesa;
}

// Aqui eu reúno todos os cálculos em uma função só para facilitar a renderização dos cards.
function somatorios(listaTransacoes) {
  const receita = calcularReceita(listaTransacoes);
  const despesa = calcularDespesa(listaTransacoes);
  const lucro = calcularLucro(receita, despesa);
  const saldo = calcularSaldoAtual(receita, despesa);

  return { receita, despesa, lucro, saldo };
}

// ====== GRÁFICO ======

// Aqui eu agrupo as transações por minuto para montar os pontos do gráfico.
function porMinuto(listaTransacoes) {
  const map = new Map();

  for (const t of listaTransacoes) {
    const key = minutosKey(t.dataISO);

    if (!map.has(key)) {
      map.set(key, { receita: 0, despesa: 0 });
    }

    const item = map.get(key);

    if (t.tipo === "entrada") {
      item.receita += t.valor;
    } else {
      item.despesa += t.valor;
    }
  }

  const minutos = [...map.keys()].sort();

  return {
    minutosOrdenados: minutos,
    receitaPorMinutos: minutos.map((k) => map.get(k).receita),
    despesaPorMinutos: minutos.map((k) => map.get(k).despesa)
  };
}

// Aqui eu desenho o gráfico com Chart.js.
// Sempre que eu atualizo os dados, eu destruo o gráfico anterior e crio um novo.
function desenharGrafico(listaTransacoes) {
  if (!ctx) return;

  const dados = porMinuto(listaTransacoes);
  const labels = dados.minutosOrdenados;
  const receitas = dados.receitaPorMinutos;
  const despesas = dados.despesaPorMinutos;

  if (grafico) {
    grafico.destroy();
  }

  grafico = new Chart(ctx, {
    type: "line",
    data: {
      labels,
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
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            // Aqui eu personalizo o título do tooltip para mostrar a data e a hora daquele ponto.
            title: function (context) {
              const minuto = context[0].label;
              const t = listaTransacoes.find((item) => minutosKey(item.dataISO) === minuto);

              if (!t) return minuto;

              const d = new Date(t.dataISO);
              const dataFormatada = `${String(d.getDate()).padStart(2, "0")}/${String(
                d.getMonth() + 1
              ).padStart(2, "0")}/${d.getFullYear()}`;
              const hora = `${String(d.getHours()).padStart(2, "0")}:${String(
                d.getMinutes()
              ).padStart(2, "0")}`;

              return `${dataFormatada} ${hora}`;
            },

            // Aqui eu personalizo o conteúdo do tooltip para mostrar as transações daquele minuto.
            label: function (context) {
              const minuto = context.label;

              const filtradas = listaTransacoes.filter(
                (t) => minutosKey(t.dataISO) === minuto
              );

              return filtradas.map(
                (t) => `${t.descricao} (${t.categoria}) - ${brl.format(t.valor)}`
              );
            }
          }
        }
      }
    }
  });
}

// ====== TABELAS ======

// Aqui eu crio o botão de excluir uma transação.
// Eu deixei separado para reaproveitar tanto na tabela de recentes quanto na tabela completa.
function criarBotaoExcluir(id) {
  const btn = document.createElement("button");
  btn.classList.add("action-btn");
  btn.type = "button";

  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1z"/>
    </svg>
  `;

  btn.addEventListener("click", () => {
    removerTransacao(id);
  });

  return btn;
}

// Aqui eu renderizo só as 5 transações mais recentes.
function renderTabela(listaTransacoes) {
  if (!tbodyRecentes || !emptyRecentes) return;

  tbodyRecentes.innerHTML = "";

  if (listaTransacoes.length === 0) {
    emptyRecentes.style.display = "block";
    return;
  }

  emptyRecentes.style.display = "none";

  listaTransacoes
    .slice(-5)
    .reverse()
    .forEach((t) => {
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
      tdAcoes.appendChild(criarBotaoExcluir(t.id));

      tr.appendChild(tdAcoes);
      tbodyRecentes.appendChild(tr);
    });
}

// Aqui eu renderizo a tabela completa usada no modal.
function renderTabelaTodas(listaTransacoes) {
  if (!tbodyTodas || !emptyTodas) return;

  tbodyTodas.innerHTML = "";

  if (listaTransacoes.length === 0) {
    emptyTodas.style.display = "block";
    return;
  }

  emptyTodas.style.display = "none";

  listaTransacoes
    .slice()
    .reverse()
    .forEach((t) => {
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
      tdAcoes.appendChild(criarBotaoExcluir(t.id));

      tr.appendChild(tdAcoes);
      tbodyTodas.appendChild(tr);
    });
}

// ====== RENDERIZAÇÃO ======

// Aqui eu atualizo os cards do topo com os valores calculados.
function renderCards(listaTransacoes) {
  const { receita, despesa, lucro, saldo } = somatorios(listaTransacoes);

  if (elReceita) elReceita.textContent = brl.format(receita);
  if (elDespesa) elDespesa.textContent = brl.format(despesa);
  if (elLucro) elLucro.textContent = brl.format(lucro);
  if (elSaldo) elSaldo.textContent = brl.format(saldo);

  // Aqui eu limpo os subtítulos dos cards porque no meu layout atual eu não estou usando essa informação.
  if (elSubReceita) elSubReceita.textContent = "";
  if (elSubDespesa) elSubDespesa.textContent = "";
  if (elSubLucro) elSubLucro.textContent = "";
  if (elSubSaldo) elSubSaldo.textContent = "";
}

// Aqui eu centralizo toda a atualização visual do sistema.
// Sempre que acontece alguma alteração, eu chamo essa função para redesenhar tudo.
function renderTudo() {
  renderCards(transacoes);
  desenharGrafico(transacoes);
  renderTabela(transacoes);
  renderTabelaTodas(transacoes);
}

// ====== CRUD ======

// Aqui eu adiciono uma nova transação no array, salvo no localStorage e atualizo a tela.
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

// Aqui eu removo uma transação pelo ID, salvo no localStorage e atualizo a tela.
function removerTransacao(id) {
  transacoes = transacoes.filter((t) => t.id !== id);
  salvarTransacoes(transacoes);
  renderTudo();
}

// ====== EVENTOS ======

// Aqui eu trato o envio do formulário.
// Eu valido os campos e, se estiver tudo certo, cadastro a nova transação.
if (form) {
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
}

// Aqui eu salvo o saldo inicial digitado no modal.
// Depois disso eu fecho o modal e atualizo a interface.
if (btnSalvarSaldo) {
  btnSalvarSaldo.addEventListener("click", () => {
    const valor = parseValorNumero(inputSaldoInicial.value);

    if (Number.isNaN(valor) || valor < 0) {
      alert("Valor inválido!");
      return;
    }

    salvarSaldoInicial(valor);

    if (modalSaldo) {
      modalSaldo.style.display = "none";
    }

    renderTudo();
  });
}

// Aqui eu removo a sessão do usuário e redireciono para o login.
if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem(KEY_SESSAO);
    window.location.href = LOGIN_REDIRECT;
  });
}

// Aqui eu abro o modal com todas as transações.
if (btnVerTodas) {
  btnVerTodas.addEventListener("click", () => {
    renderTabelaTodas(transacoes);

    if (modalOverlay) {
      modalOverlay.classList.remove("hidden");
    }
  });
}

// Aqui eu fecho o modal pelo botão.
if (btnFecharModal) {
  btnFecharModal.addEventListener("click", () => {
    if (modalOverlay) {
      modalOverlay.classList.add("hidden");
    }
  });
}

// Aqui eu também fecho o modal quando o usuário clica fora da caixa principal.
if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.add("hidden");
    }
  });
}

// ====== INICIALIZAÇÃO ======

// Aqui eu começo verificando se existe sessão.
checarSessao();

// Aqui eu carrego as transações salvas anteriormente.
transacoes = lerTransacoes();

// Aqui eu verifico se a pessoa já informou o saldo inicial.
verificarSaldoInicial();

// Aqui eu monto a saudação com o nome do usuário.
renderSaudacaoUsuario();

// Aqui eu renderizo todo o sistema logo no carregamento da página.
renderTudo();

// ====== ATUALIZAÇÃO AUTOMÁTICA ======

// Aqui eu atualizo o dashboard automaticamente a cada 60 segundos.
setInterval(() => {
  renderTudo();
}, 60000);

module.exports = {
  calcularReceita
};