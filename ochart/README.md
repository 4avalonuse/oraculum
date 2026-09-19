# OChart

OChart é a camada de observação e exploração do Oraculum.

## Arquitetura

OChart → Oraculum Data API → Cloudflare Worker + D1

O frontend não possui credenciais de provedores e não conhece detalhes do armazenamento.

## Escopo atual

- seleção de dataset;
- linha e candles;
- escala linear/log;
- janelas de visualização;
- zoom/pan;
- SMA20/SMA100;
- retorno, volatilidade, RSI e volume z-score;
- inspector de observação;
- tema claro/escuro.

O regime SMA20/SMA100 é apenas baseline e é apresentado como tal.

## Relação com o worker de features

O worker enviado para análise é uma boa base para a futura camada analítica. As duas correções consideradas obrigatórias são: symbol no schema e eventos separados por category. Não é necessário antecipar múltiplos timeframes ou classes de ativos no modelo de dados enquanto não houver caso de uso real.

Modelos e backtests ficam fora do OChart.

## Deploy

O diretório `ochart/` continua estático e pode ser publicado pelo GitHub Pages.