const form = document.querySelector("form");
const inputNome = document.querySelector("#nome-cadastro");
const inputEmail = document.querySelector("#email-cadastro");
const inputSenha = document.querySelector("#senha-cadastro");

function pegarUsuarios() {
  const usuariosJSON = localStorage.getItem("usuarios");

  if (!usuariosJSON) return [];

  return JSON.parse(usuariosJSON);
}

// 3) Função para salvar usuários
function salvarUsuarios(lista) {
  localStorage.setItem("usuarios", JSON.stringify(lista));
}

// 4) Quando clicar em Cadastrar
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const nome = inputNome.value.trim();
  const email = inputEmail.value.trim().toLowerCase();
  const senha = inputSenha.value;

  // Validação básica
  if (!nome || !email || !senha) {
    alert("Preencha todos os campos.");
    return;
  }

  if (senha.length < 6) {
    alert("A senha deve ter no mínimo 6 caracteres.");
    return;
  }

  // Pega usuários existentes
  const usuarios = pegarUsuarios();

  // Verifica se o email já existe
  const emailExiste = usuarios.find((u) => u.email === email);

  if (emailExiste) {
    alert("Este e-mail já está cadastrado.");
    return;
  }

  // Cria novo usuário
  const novoUsuario = {
    nome: nome,
    email: email,
    senha: senha
  };

  // Adiciona na lista
  usuarios.push(novoUsuario);

  // Salva no localStorage
  salvarUsuarios(usuarios);

  alert("Conta criada com sucesso!");

  // Limpa os campos
  form.reset();

  // Redireciona para login
  window.location.href = "login.html";
});
