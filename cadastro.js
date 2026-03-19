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

document.getElementById("formCadastro").addEventListener("submit", function(e){
  e.preventDefault();

  const nome = document.getElementById("nome");
  const email = document.getElementById("email");
  const senha = document.getElementById("senha");
  const confirmar = document.getElementById("confirmar");
  const erro = document.getElementById("erro");
  const btn = document.getElementById("btn");

  erro.textContent = "";
  [nome, email, senha, confirmar].forEach(campo => {
    campo.classList.remove("erro-input", "sucesso");
  });

  if(nome.value.trim().length < 3){
    erro.textContent = "Digite um nome válido.";
    nome.classList.add("erro-input");
    nome.focus();
    return;
  }

  if(!email.value.includes("@") || !email.value.includes(".")){
    erro.textContent = "Digite um e-mail válido.";
    email.classList.add("erro-input");
    email.focus();
    return;
  }

  if(senha.value.length < 6){
    erro.textContent = "A senha deve ter no mínimo 6 caracteres.";
    senha.classList.add("erro-input");
    senha.focus();
    return;
  }

  if(senha.value !== confirmar.value){
    erro.textContent = "As senhas não coincidem.";
    confirmar.classList.add("erro-input");
    confirmar.focus();
    return;
  }

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuarioExistente = usuarios.find(usuario => usuario.email === email.value.trim());

  if(usuarioExistente){
    erro.textContent = "Esse e-mail já está cadastrado.";
    email.classList.add("erro-input");
    email.focus();
    return;
  }

  usuarios.push({
    nome: nome.value.trim(),
    email: email.value.trim(),
    senha: senha.value
  });

  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  [nome, email, senha, confirmar].forEach(campo => {
    campo.classList.add("sucesso");
  });

  btn.classList.add("loading");
  btn.textContent = "Conta criada!";
  btn.style.background = "linear-gradient(90deg, #22c55e, #16a34a)";

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
});