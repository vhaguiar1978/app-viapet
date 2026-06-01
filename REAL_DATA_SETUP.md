# ViaBet Analytics - Dados 100% reais

Para operar com dados reais, o sistema precisa de fornecedores externos.

## Modo de dados

No arquivo `.env.local`:

```env
DATA_MODE=real
```

Com `DATA_MODE=real`, o sistema bloqueia dados simulados. Se faltar chave de API, a tela mostra o que precisa ser configurado.

## Jogos futuros e odds

Provider implementado:

```env
THE_ODDS_API_KEY=sua_chave_aqui
THE_ODDS_API_REGIONS=us,eu
THE_ODDS_API_MARKETS=h2h,totals,spreads
```

Esse provider alimenta:

- `/api/upcoming`
- `/proximos`

## Agenda alternativa

Provider alternativo:

```env
SPORTSDB_API_KEY=3
SPORTSDB_LEAGUE_IDS=4328,4351,4387
```

TheSportsDB ajuda com agenda de eventos, mas nao substitui um provider de odds.

## Teste operacional sem provider pago

Use somente para simular operacao:

```env
DATA_MODE=real-test
```

Esse modo mostra jogos futuros dinamicos com odds simuladas. Nao use como dados reais.

## Checklist

1. Criar conta no provider de odds.
2. Colocar a chave em `.env.local`.
3. Reiniciar o servidor.
4. Abrir `/integracoes`.
5. Conferir se The Odds API aparece como pronta.
6. Abrir `/proximos`.
