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