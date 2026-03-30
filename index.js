import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

const app = express();
const HOST = "0.0.0.0";
const PORTA = 3000;

const USUARIO_VALIDO = "admin";
const SENHA_VALIDA = "123";

let produtos = [];

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "minha-chave-secreta-session",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 },
  })
);

function renderizarPagina(tituloPagina, corpo) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tituloPagina} - SISTEMA DE ESTOQUE</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
</head>
<body class="bg-light">
  <nav class="navbar navbar-dark bg-dark px-4">
    <span class="navbar-brand fw-bold">SISTEMA DE ESTOQUE</span>
    <div class="d-flex gap-3">
      <a href="/" class="nav-link text-white">Home</a>
      <a href="/login" class="nav-link text-white">Login</a>
      <a href="/produtos" class="nav-link text-white">Produtos</a>
      <a href="/sair" class="nav-link text-white">Sair</a>
    </div>
  </nav>
  <div class="container mt-4" style="max-width:900px;">
    ${corpo}
  </div>
</body>
</html>`;
}

function tabelaProdutos() {
  if (produtos.length === 0) {
    return `<p class="text-muted fst-italic">Nenhum produto cadastrado ainda.</p>`;
  }

  const linhas = produtos
    .map(
      (p) => `
      <tr>
        <td><span class="badge bg-success">${p.codigoBarras}</span></td>
        <td>${p.descricao}</td>
        <td>R$ ${Number(p.precoCusto).toFixed(2)}</td>
        <td>R$ ${Number(p.precoVenda).toFixed(2)}</td>
        <td>${p.validade}</td>
        <td>${p.qtdEstoque}</td>
        <td>${p.fabricante}</td>
      </tr>`
    )
    .join("");

  return `
  <table class="table table-striped table-bordered table-hover align-middle">
    <thead class="table-dark">
      <tr>
        <th>Cod. Barras</th>
        <th>Descricao</th>
        <th>Custo</th>
        <th>Venda</th>
        <th>Validade</th>
        <th>Estoque</th>
        <th>Fabricante</th>
      </tr>
    </thead>
    <tbody>${linhas}</tbody>
  </table>`;
}

function formularioProduto(dados = {}, erros = {}) {
  const campo = (nome, label, tipo = "text", extras = "") => {
    const val = dados[nome] || "";
    const err = erros[nome]
      ? `<div class="alert alert-danger py-1 px-2 mt-1 mb-0">${erros[nome]}</div>`
      : "";
    return `
    <div class="mb-3">
      <label class="form-label fw-semibold">${label}</label>
      <input type="${tipo}" name="${nome}" value="${val}" class="form-control" ${extras} />
      ${err}
    </div>`;
  };

  return `
  ${campo("codigoBarras", "Codigo de Barras")}
  ${campo("descricao", "Descricao do Produto")}
  <div class="row">
    <div class="col">${campo("precoCusto", "Preco de Custo (R$)", "number", 'step="0.01" min="0"')}</div>
    <div class="col">${campo("precoVenda", "Preco de Venda (R$)", "number", 'step="0.01" min="0"')}</div>
  </div>
  <div class="row">
    <div class="col">${campo("validade", "Data de Validade", "date")}</div>
    <div class="col">${campo("qtdEstoque", "Quantidade em Estoque", "number", 'min="0"')}</div>
  </div>
  ${campo("fabricante", "Fabricante")}
  <button type="submit" class="btn btn-success">Salvar Produto</button>`;
}

function infoCookies(req) {
  const ultimoAcesso = req.cookies.registroAcesso;
  const ultimoUsuario = req.cookies.registroUsuario;

  return ultimoAcesso
    ? `<div class="alert alert-info">Ultimo acesso: <strong>${ultimoAcesso}</strong> - Usuario: <strong>${ultimoUsuario}</strong></div>`
    : `<div class="alert alert-secondary">Nenhum acesso anterior registrado nos cookies.</div>`;
}

function paginaProdutos(req, dados = {}, erros = {}, erroGeral = "") {
  return renderizarPagina(
    "Produtos",
    `<h2 class="mb-1">Cadastro de Produtos</h2>
     <p class="text-muted mb-3">Logado como <strong>${req.session.nomeUsuario}</strong></p>
     ${infoCookies(req)}
     ${erroGeral ? `<div class="alert alert-danger">${erroGeral}</div>` : ""}
     <div class="card p-4 mb-4">
       <form method="POST" action="/produtos">
         ${formularioProduto(dados, erros)}
       </form>
     </div>
     <hr />
     <h4 class="mb-3">Produtos Cadastrados</h4>
     ${tabelaProdutos()}`
  );
}

app.get("/", (req, res) => {
  const nomeUsuario = req.session.nomeUsuario;

  const corpo = nomeUsuario
    ? `<h2>Ola, ${nomeUsuario}!</h2>
       <div class="card p-4 mt-3">
         <p class="mb-3">Voce esta autenticado no sistema.</p>
         <a href="/produtos" class="btn btn-success me-2">Ir para Produtos</a>
         <a href="/sair" class="btn btn-secondary">Sair</a>
       </div>`
    : `<h2>Bem-vindo ao SISTEMA DE ESTOQUE</h2>
       <div class="card p-4 mt-3">
         <p class="mb-3">Faca login para gerenciar o estoque de produtos.</p>
         <a href="/login" class="btn btn-primary">Fazer Login</a>
       </div>`;

  res.send(renderizarPagina("Inicio", corpo));
});

app.get("/login", (req, res) => {
  if (req.session.nomeUsuario) return res.redirect("/produtos");

  res.send(
    renderizarPagina(
      "Login",
      `<div class="row justify-content-center mt-4">
        <div class="col-md-5">
          <div class="card p-4">
            <h3 class="mb-4">Acesso ao Sistema</h3>
            <form method="POST" action="/login">
              <div class="mb-3">
                <label class="form-label fw-semibold">Usuario</label>
                <input type="text" name="usuario" class="form-control" autocomplete="username" />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Senha</label>
                <input type="password" name="senha" class="form-control" autocomplete="current-password" />
              </div>
              <button type="submit" class="btn btn-primary w-100">Entrar</button>
            </form>
          </div>
        </div>
      </div>`
    )
  );
});

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  let alertas = "";
  if (!usuario) alertas += `<div class="alert alert-danger">Informe o usuario.</div>`;
  if (!senha)   alertas += `<div class="alert alert-danger">Informe a senha.</div>`;

  if (!alertas && (usuario !== USUARIO_VALIDO || senha !== SENHA_VALIDA)) {
    alertas += `<div class="alert alert-danger">Usuario ou senha invalidos.</div>`;
  }

  if (alertas) {
    return res.send(
      renderizarPagina(
        "Login",
        `<div class="row justify-content-center mt-4">
          <div class="col-md-5">
            <div class="card p-4">
              <h3 class="mb-3">Acesso ao Sistema</h3>
              ${alertas}
              <form method="POST" action="/login">
                <div class="mb-3">
                  <label class="form-label fw-semibold">Usuario</label>
                  <input type="text" name="usuario" value="${usuario || ""}" class="form-control" />
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold">Senha</label>
                  <input type="password" name="senha" class="form-control" />
                </div>
                <button type="submit" class="btn btn-primary w-100">Entrar</button>
              </form>
            </div>
          </div>
        </div>`
      )
    );
  }

  req.session.nomeUsuario = usuario;
  const agora = new Date().toLocaleString("pt-BR");
  res.cookie("registroAcesso", agora, { maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.cookie("registroUsuario", usuario, { maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.redirect("/produtos");
});

app.get("/sair", (req, res) => {
  req.session.destroy();
  res.send(
    renderizarPagina(
      "Logout",
      `<div class="alert alert-warning mt-3">Sessao encerrada com sucesso.</div>
       <a href="/login" class="btn btn-primary">Voltar ao Login</a>`
    )
  );
});

app.get("/produtos", (req, res) => {
  if (!req.session.nomeUsuario) {
    return res.send(
      renderizarPagina(
        "Acesso Negado",
        `<div class="alert alert-danger mt-3">
           <strong>Acesso negado!</strong> Voce precisa estar logado para acessar esta pagina.
         </div>
         <a href="/login" class="btn btn-primary">Ir para o Login</a>`
      )
    );
  }

  res.send(paginaProdutos(req));
});

app.post("/produtos", (req, res) => {
  if (!req.session.nomeUsuario) return res.redirect("/login");

  const camposObrigatorios = [
    "codigoBarras",
    "descricao",
    "precoCusto",
    "precoVenda",
    "validade",
    "qtdEstoque",
    "fabricante",
  ];

  const mensagensErro = {
    codigoBarras: "Informe o codigo de barras.",
    descricao: "Informe a descricao do produto.",
    precoCusto: "Informe o preco de custo.",
    precoVenda: "Informe o preco de venda.",
    validade: "Informe a data de validade.",
    qtdEstoque: "Informe a quantidade em estoque.",
    fabricante: "Informe o nome do fabricante.",
  };

  const dados = {};
  const erros = {};

  camposObrigatorios.forEach((campo) => {
    const valor = req.body[campo];
    dados[campo] = valor;
    if (!valor) erros[campo] = mensagensErro[campo];
  });

  if (Object.keys(erros).length > 0) {
    return res.send(
      paginaProdutos(req, dados, erros, "Preencha todos os campos obrigatorios.")
    );
  }

  produtos.push(dados);
  res.redirect("/produtos");
});

app.listen(PORTA, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORTA}`);
});
