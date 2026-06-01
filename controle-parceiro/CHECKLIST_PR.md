# Checklist de Pull Request

Use este checklist antes de aprovar qualquer alteracao do parceiro.

## Identificacao

- Branch do parceiro:
- Link do Pull Request:
- Objetivo da alteracao:

## Revisao tecnica

- [ ] A alteracao esta dentro do combinado.
- [ ] Nao houve alteracao desnecessaria em arquivos fora do escopo.
- [ ] Nao foram enviados arquivos `.env*`.
- [ ] Nao foram enviados tokens, senhas, chaves ou credenciais.
- [ ] `npm install` foi executado quando houve mudanca em dependencias.
- [ ] `npm run build` passou sem erro.
- [ ] O fluxo principal do sistema foi testado.

## Seguranca de producao

- [ ] O parceiro nao fez push direto na branch principal.
- [ ] O PR sera revisado antes do merge.
- [ ] O deploy, se automatico, esta vinculado apenas a branch principal.
- [ ] Existe possibilidade de reverter o merge se algo falhar.

## Aprovacao

- [ ] Aprovado para merge.
- [ ] Merge realizado.
- [ ] Sistema conferido apos o merge/deploy.

