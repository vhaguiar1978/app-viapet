# Controle de acesso do parceiro

Esta pasta organiza o fluxo seguro para um parceiro trabalhar no projeto sem derrubar o sistema principal.

## Objetivo

- O parceiro trabalha sempre em uma branch separada.
- A branch principal fica protegida.
- Toda alteracao passa por Pull Request antes de entrar em producao.
- Nenhum arquivo sensivel, como `.env.local`, deve ser enviado ao GitHub.

## Permissao recomendada no GitHub

No repositorio `vhaguiar1978/app-viapet`, adicione o parceiro como colaborador com permissao `Write`.

Caminho:

```text
Settings > Collaborators and teams > Add people
```

Use `Admin` somente se ele tambem puder alterar configuracoes do repositorio, permissoes, secrets e branches protegidas.

## Fluxo seguro de trabalho

O parceiro deve clonar o projeto:

```bash
git clone https://github.com/vhaguiar1978/app-viapet.git
cd app-viapet
```

Antes de alterar qualquer coisa:

```bash
git pull origin main
git checkout -b parceiro/nome-da-tarefa
```

Depois de alterar:

```bash
npm install
npm run build
git status
git add .
git commit -m "Descricao clara da alteracao"
git push origin parceiro/nome-da-tarefa
```

Em seguida, ele abre um Pull Request para a branch principal.

## Regra principal

Nao fazer push direto na branch `main` ou `master`.

Toda alteracao deve ir por Pull Request, com build aprovado, antes de entrar no sistema principal.

## Arquivos sensiveis

Nunca enviar:

```text
.env
.env.local
.env.production
node_modules/
.next/
.vercel/
```

O arquivo `.env.example` pode ficar no repositorio porque serve apenas como modelo.

## Antes de aprovar um Pull Request

Confira:

- O PR altera apenas o que foi combinado.
- O comando `npm run build` passa sem erro.
- Nao existem arquivos `.env*` no PR.
- Nao existem chaves, senhas, tokens ou dados reais expostos.
- A alteracao foi testada em ambiente local ou preview.
- O sistema atual continua rodando enquanto o PR e revisado.

## Como manter o sistema online

- O ambiente em producao deve apontar para a branch principal protegida.
- O parceiro trabalha em branch separada.
- Deploy automatico, se existir, deve rodar apenas quando a branch principal receber merge.
- Para testar mudancas do parceiro, use ambiente local ou preview, nunca direto em producao.

