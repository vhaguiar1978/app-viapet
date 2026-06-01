# Comandos para o parceiro

## Primeira configuracao

```bash
git clone https://github.com/vhaguiar1978/app-viapet.git
cd app-viapet
npm install
```

Configure nome e email do Git:

```bash
git config --global user.name "Nome do parceiro"
git config --global user.email "email-do-github@exemplo.com"
```

## Comecar uma tarefa

```bash
git pull origin main
git checkout -b parceiro/nome-da-tarefa
```

Se o repositorio principal estiver usando `master` em vez de `main`, troque `main` por `master`.

## Testar antes de enviar

```bash
npm run build
```

## Enviar alteracoes

```bash
git status
git add .
git commit -m "Descricao clara da alteracao"
git push origin parceiro/nome-da-tarefa
```

Depois disso, abrir um Pull Request no GitHub.

## Atualizar a branch com a principal

```bash
git checkout parceiro/nome-da-tarefa
git pull origin main
```

Se o repositorio principal estiver usando `master`, use:

```bash
git pull origin master
```

