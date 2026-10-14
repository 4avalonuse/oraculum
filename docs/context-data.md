# Oraculum — Dados de contexto

A camada de análise passa a distinguir **ativos de mercado** de **variáveis de contexto**.

## Séries iniciais

| Chave | Série | Categoria | Fonte | Frequência |
|---|---|---|---|---|
| CPI_US | CPI EUA | Macro | BLS via FRED | Mensal |
| GOLD | Ouro spot (XAU/USD) | Commodity | XAUS spot API | Diária (série de preço; gráfico em linha) |
| OIL_WTI | Petróleo WTI spot (DCOILWTICO) | Commodity | EIA via FRED | Diária (série de preço; gráfico em linha) |
| SP500 | S&P 500 (^GSPC) | Índice | Yahoo Finance | Diária |
| DXY | DXY (DX-Y.NYB) | Câmbio | Yahoo Finance | Diária |

O CPI usado como deflator é o **CPIAUCSL**, índice mensal e sazonalmente ajustado do BLS disponibilizado pelo FRED. A inflação anual é derivada das variações do índice, não armazenada como preço.

## Regra de arquitetura

Essas séries devem entrar pelo mesmo **Data API → D1 → normalização → análise** usado pelos ativos. Não criar uma segunda camada de backend no frontend.

## Deflação

Para uma série nominal P(t) e um índice de preços CPI(t):

`P_real(t) = P(t) × CPI(base) / CPI(t)`

O Oraculum deve guardar no resultado:
- série nominal;
- série real;
- índice/versão usado;
- data-base;
- frequência;
- fonte.

A transformação já possui primitives em `src/analysis/engine.js`.

## Commodities spot implementadas

- Ouro: XAUS fornece histórico diário XAU/USD e cotação spot recente. A ingestão inicial fica limitada a 18 meses para conter escritas no D1.
- Petróleo: `DCOILWTICO`, preço spot diário WTI em Cushing publicado pela EIA e distribuído via FRED. A série tem apenas um valor diário; por isso o gráfico é uma linha, não candles OHLC inventados. A ingestão inicial também fica limitada a 18 meses.
- As séries spot aceitam frequência diária. Não são combinadas com os datasets antigos de futuros, que permanecem separados no banco sem serem usados por esses ativos da interface.