// ============ CONFIG ============
const CHAVE_USUARIOS = "usuarios";
const CHAVE_SESSAO = "usuarioLogado";
const PAGINA_DASHBOARD = "index.html";

// ============ ELEMENTOS ============
const form = document.querySelector(".form-login");
const inputEmail = document.querySelector("#email");
const inputSenha = document.querySelector("#senha");
const erro = document.querySelector("#erro");
const btn = document.querySelector("#btnEntrar");

// ============ FUNÇÕES ============
function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// Mostrar/ocultar senha
function toggleSenha(id, botao) {
  const input = document.getElementById(id);

  if (input.type === "password") {
    input.type = "text";
    if (botao) botao.textContent = "🙈";
  } else {
    input.type = "password";
    if (botao) botao.textContent = "👁️";
  }
}

// ============ LOGIN ============
form.addEventListener("submit", function (e) {
  e.preventDefault();

  erro.textContent = "";

  inputEmail.classList.remove("erro-input", "sucesso");
  inputSenha.classList.remove("erro-input", "sucesso");

  const email = normalizarEmail(inputEmail.value);
  const senha = inputSenha.value;

  if (!email || !senha) {
    erro.textContent = "Preencha e-mail e senha.";
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem(CHAVE_USUARIOS)) || [];

  const usuarioEncontrado = usuarios.find(
    (u) =>
      normalizarEmail(u.email) === email &&
      u.senha === senha
  );

  if (!usuarioEncontrado) {
    erro.textContent = "E-mail ou senha incorretos.";
    inputEmail.classList.add("erro-input");
    inputSenha.classList.add("erro-input");
    inputEmail.focus();
    return;
  }

  // salva sessão
  localStorage.setItem(
    CHAVE_SESSAO,
    JSON.stringify({
      nome: usuarioEncontrado.nome,
      email: usuarioEncontrado.email,
    })
  );

  inputEmail.classList.add("sucesso");
  inputSenha.classList.add("sucesso");

  btn.classList.add("loading");
  btn.textContent = "Entrando...";

  setTimeout(() => {
    window.location.href = PAGINA_DASHBOARD;
  }, 800);
});