# 🌵 Raízes do Nordeste

**API REST para gerenciamento de pedidos e pagamentos simulados.**

O **Raízes do Nordeste** é um projeto de back-end desenvolvido para simular o funcionamento de um sistema de pedidos de uma rede de restaurantes.

A aplicação permite cadastrar e autenticar usuários, consultar e gerenciar produtos, registrar pedidos em diferentes canais de atendimento e simular pagamentos.

O sistema utiliza autenticação JWT e controle de acesso por perfil, diferenciando clientes e administradores.

## 🛠️ Tecnologias utilizadas

- **Node.js:** ambiente de execução JavaScript.
- **Express:** criação e gerenciamento das rotas da API.
- **Prisma ORM:** comunicação com o banco de dados.
- **SQLite:** armazenamento dos dados.
- **JWT:** autenticação e proteção de rotas.
- **Swagger:** documentação interativa da API.
- **Postman:** realização de testes das requisições HTTP.

## 📦 Instalação

1. Abra a pasta `Raizes_do_Nordeste` no Visual Studio Code.
2. Abra o terminal na pasta principal do projeto.
3. Instale as dependências:

   `npm install`

4. Gere o Prisma Client:

   `npx prisma generate`

5. Aplique as migrações existentes ao banco de dados:

   `npx prisma migrate deploy`

## ⚙️ Configuração do ambiente

Copie o arquivo `.env.example` e renomeie a cópia para `.env`.

Configure as variáveis de ambiente:

- `DATABASE_URL`: endereço do banco de dados SQLite.
- `JWT_SECRET`: chave secreta utilizada na autenticação JWT.

**Importante:** utilize uma chave secreta própria e não compartilhe o arquivo `.env`.

## 🚀 Execução

Para iniciar a aplicação, execute no terminal:

`node servidor.js`

Com o servidor em funcionamento, a API estará disponível em:

`http://localhost:3000`

A documentação interativa do Swagger pode ser acessada em:

**http://localhost:3000/api-docs**

## 📌 Endpoints da API

### Usuários e autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/usuarios` | Cadastrar usuário |
| POST | `/login` | Autenticar usuário |

### Produtos

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/produtos` | Consultar produtos |
| POST | `/produtos` | Cadastrar produto |
| PUT | `/produtos/:id` | Atualizar produto |
| DELETE | `/produtos/:id` | Excluir produto |

### Pedidos e pagamentos

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/pedidos` | Criar pedido |
| GET | `/pedidos` | Consultar pedidos do usuário autenticado |
| POST | `/pedidos/:id/pagamento` | Simular pagamento |

A API possui rotas protegidas por autenticação JWT e operações administrativas restritas a usuários com perfil `ADMIN`.

## 🧪 Testes realizados

Foram realizados **11 testes utilizando o Postman**, contemplando operações bem-sucedidas e situações de erro.

Os testes abrangeram:

- Cadastro e autenticação de usuários.
- Consulta de produtos disponíveis.
- Criação e consulta de pedidos.
- Simulação de pagamento aprovado.
- Simulação de pagamento recusado.
- Validação de respostas HTTP `400`, `401`, `403` e `404`.

As evidências dos testes foram registradas por meio de capturas de tela, e a coleção de requisições foi exportada em formato JSON.

## 📚 Documentação e modelagem

O projeto conta com documentação Swagger e diagramas de apoio à compreensão do sistema:

- Diagrama de Casos de Uso.
- Diagrama Entidade-Relacionamento (DER).
- Diagrama de Classes UML.
- Diagrama de Arquitetura.

## 🎓 Finalidade do projeto

Projeto acadêmico desenvolvido para aplicar conhecimentos de desenvolvimento back-end, construção de APIs REST, persistência de dados, autenticação, documentação e testes de software.