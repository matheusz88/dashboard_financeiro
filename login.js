// login.js

// ============ CONFIG ============
// CHAVE onde o cadastro salva a lista de usuários:
const CHAVE_USUARIOS = "usuarios";

// CHAVE da sessão (quem está logado):
const CHAVE_SESSAO = "usuarioLogado";

// Para onde ir após login:
const PAGINA_DASHBOARD = "index.html";

// ============ ELEMENTOS ============
// Seu HTML tem <form class="form-login"> e inputs #email e #senha
const form = document.querySelector(".form-login");
const inputEmail = document.querySelector("#email");
const inputSenha = document.querySelector("#senha");

// ============ FUNÇÕES UTILITÁRIAS ============
function lerJSON(chave, padrao) {
  const valor = localStorage.getItem(chave);
  if (!valor) return padrao;

  try {
    return JSON.parse(valor);
  } catch (e) {
    console.error(`Erro ao ler JSON da chave "${chave}"`, e);
    return padrao;

function toggleSenha(id, botao){
  const input = document.getElementById(id);

  if(input.type === "password"){
    input.type = "text";
    if(botao) botao.textContent = "🙈";
  }else{
    input.type = "password";
    if(botao) botao.textContent = "👁️";

  }
}

document.getElementById("formLogin").addEventListener("submit", function(e){
  e.preventDefault();

  const email = document.getElementById("email");
  const senha = document.getElementById("senha");
  const erro = document.getElementById("erro");
  const btn = document.getElementById("btnEntrar");

  erro.textContent = "";
  [email, senha].forEach(campo => {
    campo.classList.remove("erro-input", "sucesso");
  });

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuarioEncontrado = usuarios.find(usuario =>
    usuario.email === email.value.trim() && usuario.senha === senha.value
  );

  if(!usuarioEncontrado){
    erro.textContent = "E-mail ou senha incorretos.";
    email.classList.add("erro-input");
    senha.classList.add("erro-input");
    email.focus();
    return;
  }

  localStorage.setItem("usuarioLogado", JSON.stringify(usuarioEncontrado));

  email.classList.add("sucesso");
  senha.classList.add("sucesso");

  btn.classList.add("loading");
  btn.textContent = "Entrando...";
  btn.style.background = "linear-gradient(90deg, #22c55e, #16a34a)";

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
});