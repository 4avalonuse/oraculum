# Oraculum — Dados de contexto

A camada de análise passa a distinguir **ativos de mercado** de **variáveis de contexto**.

## Séries iniciais

| Chave | Série | Categoria | Fonte | Frequência |
|---|---|---|---|---|
| CPI_US | CPI EUA | Macro | BLS via FRED | Mensal |
| GOLD | Ouro (GC=F) | Commodity | Yahoo Finance | Diária |
| OIL_WTI | Petróleo WTI (CL=F) | Commodity | Yahoo Finance | Diária |
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

## Próxima integração

O catálogo de datasets do Data API deve receber os contextos acima. Depois disso, a interface poderá habilitar os controles hoje marcados como `EM BREVE`, sem criar outro backend.