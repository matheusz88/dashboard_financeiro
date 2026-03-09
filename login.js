// login.js

// ============ CONFIG ============
// CHAVE onde o cadastro salva a lista de usuários:
const CHAVE_USUARIOS = "usuarios";

// CHAVE da sessão (quem está logado):
const CHAVE_SESSAO = "usuarioLogado";

// Para onde ir após login:
const PAGINA_DASHBOARD = "dashboard.html";

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
  }
}

function salvarJSON(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// ============ "BANCO" (localStorage) ============
function pegarUsuarios() {
  // Esperado: [{nome, email, senha}, ...]
  return lerJSON(CHAVE_USUARIOS, []);
}

function encontrarUsuarioPorEmail(email) {
  const usuarios = pegarUsuarios();
  const emailNorm = normalizarEmail(email);
  return usuarios.find((u) => normalizarEmail(u.email) === emailNorm) || null;
}

function salvarSessao(usuario) {
  // salva só o básico (não precisa guardar senha)
  const sessao = {
    nome: usuario.nome || "Usuário",
    email: normalizarEmail(usuario.email),
    loginEm: new Date().toISOString(),
  };

  salvarJSON(CHAVE_SESSAO, sessao);
}

// ============ (EXTRA) USUÁRIO DEMO PRA TESTE ============
function garantirUsuarioDemo() {
  const usuarios = pegarUsuarios();

  // se não tem ninguém cadastrado, cria um demo
  if (usuarios.length === 0) {
    usuarios.push({
      nome: "Demo",
      email: "demo@gmail.com",
      senha: "123456",
    });

    salvarJSON(CHAVE_USUARIOS, usuarios);
    console.warn("Nenhum usuário encontrado. Criado usuário DEMO: demo@gmail.com / 123456");
  }
}

// ============ LOGIN ============
function fazerLogin(email, senha) {
  const usuario = encontrarUsuarioPorEmail(email);

  if (!usuario) {
    return { ok: false, msg: "E-mail não cadastrado. Crie uma conta primeiro." };
  }

  if (usuario.senha !== senha) {
    return { ok: false, msg: "Senha incorreta. Tente novamente." };
  }

  salvarSessao(usuario);
  return { ok: true, msg: "Login realizado com sucesso!" };
}

// ============ EVENTO DO FORM ============
if (!form) {
  console.error('Form ".form-login" não encontrado no HTML.');
} else {
  // Descomenta se quiser sempre ter um usuário pra testar:
  garantirUsuarioDemo();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = normalizarEmail(inputEmail.value);
    const senha = inputSenha.value;

    if (!email || !senha) {
      alert("Preencha e-mail e senha.");
      return;
    }

    const resultado = fazerLogin(email, senha);

    if (!resultado.ok) {
      alert(resultado.msg);
      return;
    }

    window.location.href = PAGINA_DASHBOARD;
  });
}