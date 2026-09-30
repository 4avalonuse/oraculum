# ORACULUM

Fundação limpa do sistema de investigação e análise de mercado.

Este repositório foi zerado de propósito. A aplicação será reconstruída a partir de uma arquitetura limpa, sem carregar a implementação anterior do gráfico.

## Fundação preservada

- **Data API:** `https://oraculum-data-api.4avalonuse.workers.dev`
- **Backend:** Cloudflare Worker
- **Banco:** Cloudflare D1
- **Modelo de dados:** datasets + candles + api_meta
- **Fontes de mercado já existentes:** Yahoo Finance e Binance.US

O banco e a Data API são infraestrutura compartilhada e não serão recriados como parte deste reset.

## Próxima construção

A nova implementação será criada por módulos, começando pela fundação de dados e navegação do ORACULUM.

O gráfico será apenas uma capacidade visual reutilizável dentro do sistema, não a identidade do produto.

## Regra do reset

Nenhum código da aplicação anterior deve ser carregado automaticamente para a nova base. Conceitos comprovados poderão ser reimplementados depois, conscientemente e em pequenas etapas.
