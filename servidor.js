require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const express = require("express");
const { PrismaClient, Prisma } = require("@prisma/client");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

function autenticar(req, res, next) {
  const autorizacao = req.headers.authorization;

  if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
    return res.status(401).json({
      erro: "Token não informado",
    });
  }

  const token = autorizacao.split(" ")[1];

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = dados;
    next();
  } catch (erro) {
    return res.status(401).json({
      erro: "Token inválido ou expirado",
    });
  }
}

function somenteAdmin(req, res, next) {
  if (req.usuario.perfil !== "ADMIN") {
    return res.status(403).json({
      erro: "Acesso permitido somente para administradores",
    });
  }

  next();
}

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Raízes do Nordeste API",
      version: "1.0.0",
      description:
        "API para gerenciamento de usuários, produtos, pedidos e pagamentos simulados.",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./servidor.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post("/protegido", autenticar, somenteAdmin, (req, res) => {
  res.json({ mensagem: "Acesso autorizado" });
});

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Listar produtos
 *     description: Retorna os produtos cadastrados no sistema.
 *     tags:
 *       - Produtos
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso.
 *       500:
 *         description: Erro interno do servidor.
 */

app.get("/produtos", async (req, res) => {
  const produtos = await prisma.produto.findMany();
  res.json(produtos);
});

/**
 * @swagger
 * /produtos:
 *   post:
 *     summary: Cadastrar produto
 *     description: Permite que administradores cadastrem produtos.
 *     tags:
 *       - Produtos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - preco
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *                 format: double
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *     responses:
 *       201:
 *         description: Produto cadastrado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Token ausente ou inválido.
 *       403:
 *         description: Usuário sem permissão de administrador.
 */

app.post("/produtos", autenticar, somenteAdmin, async (req, res) => {
  try {
    const { nome, descricao, preco } = req.body;

    if (
      typeof nome !== "string" ||
      nome.trim() === "" ||
      preco == null ||
      !Number.isFinite(Number(preco)) ||
      Number(preco) <= 0
    ) {
      return res.status(400).json({
        erro: "Nome e preço válido são obrigatórios",
      });
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        preco: Number(preco),
      },
    });

    res.status(201).json(produto);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao cadastrar produto" });
  }
});

/**
 * @swagger
 * /produtos/{id}:
 *   put:
 *     summary: Atualizar produto
 *     description: Permite que administradores atualizem um produto.
 *     tags:
 *       - Produtos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - preco
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *                 exclusiveMinimum: true
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       401:
 *         description: Token ausente ou inválido.
 *       403:
 *         description: Acesso restrito a administradores.
 *       404:
 *         description: Produto não encontrado.
 */

app.put("/produtos/:id", autenticar, somenteAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nome, descricao, preco } = req.body;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      typeof nome !== "string" ||
      !nome.trim() ||
      preco == null ||
      !Number.isFinite(Number(preco)) ||
      Number(preco) <= 0
    ) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        nome,
        descricao,
        preco: Number(preco),
      },
    });

    res.json(produto);
  } catch (erro) {
    if (erro.code === "P2025") {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    res.status(500).json({ erro: "Erro ao atualizar" });
  }
});

/**
 * @swagger
 * /produtos/{id}:
 *   delete:
 *     summary: Excluir produto
 *     description: Permite que administradores excluam um produto.
 *     tags:
 *       - Produtos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do produto
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Produto excluído com sucesso.
 *       400:
 *         description: ID inválido.
 *       401:
 *         description: Token ausente ou inválido.
 *       403:
 *         description: Acesso restrito a administradores.
 *       404:
 *         description: Produto não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */

app.delete("/produtos/:id", autenticar, somenteAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido" });
    }

    await prisma.produto.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (erro) {
    if (erro.code === "P2025") {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }
    if (erro.code === "P2003") {
      return res.status(409).json({
        erro: "Produto vinculado a pedidos não pode ser excluído",
      });
    }

    res.status(500).json({ erro: "Erro ao excluir" });
  }
});

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cadastrar usuário
 *     tags:
 *       - Usuários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               senha:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       409:
 *         description: Email já cadastrado.
 */

app.post("/usuarios", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      typeof email !== "string" ||
      !email.includes("@") ||
      typeof senha !== "string" ||
      senha.length < 8
    ) {
      return res.status(400).json({
        erro: "Informe nome, email e senha de pelo menos 8 caracteres",
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const existente = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (existente) {
      return res.status(409).json({
        erro: "Email já cadastrado",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: emailNormalizado,
        senhaHash,
        perfil: "CLIENTE",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        dataCriacao: true,
      },
    });

    return res.status(201).json(usuario);
  } catch (erro) {
    if (erro.code === "P2002") {
      return res.status(409).json({
        erro: "Email já cadastrado",
      });
    }

    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao cadastrar usuário",
    });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realizar login
 *     description: Autentica o usuário e retorna um token JWT.
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               senha:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 *       400:
 *         description: Dados obrigatórios não informados.
 *       401:
 *         description: Credenciais inválidas.
 */

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof senha !== "string" ||
      !senha
    ) {
      return res.status(400).json({
        erro: "Email e senha são obrigatórios",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!usuario) {
      return res.status(401).json({
        erro: "Credenciais inválidas",
      });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: "Credenciais inválidas",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        erro: "Autenticação não configurada",
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        perfil: usuario.perfil,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return res.status(200).json({
      mensagem: "Login realizado com sucesso",
      token,
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      erro: "Erro interno no login",
    });
  }
});

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Criar pedido
 *     description: Cria um pedido para o usuário autenticado.
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - canalPedido
 *               - itens
 *             properties:
 *               canalPedido:
 *                 type: string
 *                 enum: [APP, TOTEM, BALCAO, PICKUP, WEB]
 *               itens:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - produtoId
 *                     - quantidade
 *                   properties:
 *                     produtoId:
 *                       type: integer
 *                     quantidade:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso.
 *       400:
 *         description: Dados do pedido inválidos.
 *       401:
 *         description: Token ausente ou inválido.
 *       404:
 *         description: Produto não encontrado ou indisponível.
 *       500:
 *         description: Erro interno do servidor.
 */

app.post("/pedidos", autenticar, async (req, res) => {
  try {
    const { canalPedido, itens } = req.body;
    const canaisValidos = ["APP", "TOTEM", "BALCAO", "PICKUP", "WEB"];

    if (!canaisValidos.includes(canalPedido)) {
      return res.status(400).json({
        erro: "Canal de pedido inválido",
      });
    }

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        erro: "O pedido deve conter pelo menos um produto",
      });
    }

    let valorTotal = new Prisma.Decimal(0);
    const itensPreparados = [];

    for (const item of itens) {
      if (
        !item ||
        !Number.isInteger(item.produtoId) ||
        item.produtoId <= 0 ||
        !Number.isInteger(item.quantidade) ||
        item.quantidade <= 0
      ) {
        return res.status(400).json({
          erro: "Produto ou quantidade inválida",
        });
      }

      const produto = await prisma.produto.findUnique({
        where: { id: item.produtoId },
      });

      if (!produto || !produto.disponivel) {
        return res.status(404).json({
          erro: "Produto não encontrado ou indisponível",
        });
      }

      const preco = new Prisma.Decimal(produto.preco);

      valorTotal = valorTotal.plus(preco.mul(item.quantidade));

      itensPreparados.push({
        produtoId: produto.id,
        quantidade: item.quantidade,
        precoUnitario: preco,
      });
    }

    const pedido = await prisma.pedido.create({
      data: {
        usuarioId: req.usuario.id,
        canalPedido: canalPedido,
        status: "PENDENTE",
        valorTotal: valorTotal,
        itens: {
          create: itensPreparados,
        },
      },
      include: {
        itens: true,
      },
    });

    return res.status(201).json(pedido);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao criar pedido",
    });
  }
});

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Consultar pedidos
 *     description: Lista os pedidos do usuário autenticado.
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: canalPedido
 *         required: false
 *         schema:
 *           type: string
 *           enum: [APP, TOTEM, BALCAO, PICKUP, WEB]
 *     responses:
 *       200:
 *         description: Pedidos consultados com sucesso.
 *       400:
 *         description: Canal de pedido inválido.
 *       401:
 *         description: Token ausente ou inválido.
 *       500:
 *         description: Erro interno do servidor.
 */

app.get("/pedidos", autenticar, async (req, res) => {
  try {
    const { canalPedido } = req.query;

    const canaisValidos = ["APP", "TOTEM", "BALCAO", "PICKUP", "WEB"];

    if (canalPedido !== undefined && !canaisValidos.includes(canalPedido)) {
      return res.status(400).json({
        erro: "Canal de pedido inválido",
      });
    }

    const filtros = {
      usuarioId: req.usuario.id,
    };

    if (canalPedido) {
      filtros.canalPedido = canalPedido;
    }

    const pedidos = await prisma.pedido.findMany({
      where: filtros,
      include: {
        itens: true,
        pagamento: true,
      },
      orderBy: {
        dataCriacao: "desc",
      },
    });

    return res.status(200).json(pedidos);

    
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao consultar pedidos",
    });
  }
});

/**
 * @swagger
 * /pedidos/{id}/pagamento:
 *   post:
 *     summary: Simular pagamento de pedido
 *     description: Registra um pagamento simulado e atualiza o status do pedido.
 *     tags:
 *       - Pagamentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do pedido
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formaPagamento
 *             properties:
 *               formaPagamento:
 *                 type: string
 *                 enum: [PIX, CREDITO, DEBITO, DINHEIRO]
 *               simularRecusa:
 *                 type: boolean
 *                 description: Define se o pagamento simulado será recusado.
 *                 default: false
 *     responses:
 *       201:
 *         description: Pagamento simulado registrado com sucesso.
 *       400:
 *         description: ID ou forma de pagamento inválidos.
 *       401:
 *         description: Token ausente ou inválido.
 *       403:
 *         description: Usuário não autorizado a pagar este pedido.
 *       404:
 *         description: Pedido não encontrado.
 *       409:
 *         description: Pedido já possui pagamento registrado.
 *       500:
 *         description: Erro interno do servidor.
 */

app.post("/pedidos/:id/pagamento", autenticar, async (req, res) => {
  try {
    const pedidoId = Number(req.params.id);
    const { formaPagamento, simularRecusa = false } = req.body;

    if (typeof simularRecusa !== "boolean") {
      return res.status(400).json({
        erro: "Valor de simularRecusa inválido",
      });
    }

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return res.status(400).json({
        erro: "ID do pedido inválido",
      });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { pagamento: true },
    });

    if (!pedido) {
      return res.status(404).json({
        erro: "Pedido não encontrado",
      });
    }

    const formasValidas = ["PIX", "CREDITO", "DEBITO", "DINHEIRO"];

    if (!formasValidas.includes(formaPagamento)) {
      return res.status(400).json({
        erro: "Forma de pagamento inválida",
      });
    }

    if (pedido.usuarioId !== req.usuario.id) {
      return res.status(403).json({
        erro: "Você não tem permissão para pagar este pedido",
      });
    }

    if (pedido.pagamento) {
      return res.status(409).json({
        erro: "Este pedido já possui um pagamento registrado",
      });
    }

    const statusPagamento = simularRecusa ? "RECUSADO" : "APROVADO";
    const statusPedido = simularRecusa ? "PENDENTE" : "PAGO";

    const [pagamento, pedidoAtualizado] = await prisma.$transaction([
      prisma.pagamento.create({
        data: {
          pedidoId: pedidoId,
          valor: pedido.valorTotal,
          formaPagamento: formaPagamento,
          status: statusPagamento,
          dataPagamento: simularRecusa ? null : new Date(),
        },
      }),

      prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          status: statusPedido,
        },
      }),
    ]);

    return res.status(201).json({
      pagamento,
      pedido: pedidoAtualizado,
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({
      erro: "Erro ao processar pagamento",
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
