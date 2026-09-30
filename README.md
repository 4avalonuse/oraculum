# ORACULUM

Sistema modular de investigação e análise de mercado.

O ORACULUM não é apenas um gráfico. É o ambiente onde dados de mercado, contexto, eventos, variáveis, relações, hipóteses e estratégias podem ser reunidos, comparados e testados.

## Arquitetura

DATA → VISÃO → INVESTIGAÇÃO → WORKSPACE → HIPÓTESES → OALGO → OBACKTEST → OWIN (futuro)

O gráfico é uma fundação visual dentro do sistema, não o produto inteiro.

## Workspace

O Workspace é o ambiente editável de investigação do ORACULUM. Nele poderão coexistir gráficos, ativos, variáveis, eventos, timelines, relações, anotações, hipóteses e resultados.

O eixo temporal é um contrato central: diferentes objetos podem ser alinhados, comparados, sobrepostos e investigados no mesmo contexto.

## Fundação técnica

Este repositório reaproveita conceitos e componentes técnicos já comprovados no desenvolvimento anterior, especialmente renderização, viewport, escala normal/log, navegação, desenhos, estudos, normalização de candles, cache, estado local e Data API.

A identidade, arquitetura de produto e evolução deste repositório pertencem ao ORACULUM.

## Princípios

- DATA não conhece UI.
- CHART não carrega dados.
- INTERACTION roteia intenção.
- UI não contém lógica de domínio.
- `app` orquestra; não concentra funcionalidades.
- Domínio, aplicação, infraestrutura e apresentação permanecem separados.
- Primeiro contratos; depois implementação.
- Não reconstruir o que já é uma fundação técnica válida.
- Não transformar o ORACULUM em um gráfico maior.

## Estado atual

A fundação gráfica e o primeiro núcleo conceitual de investigação já existem. A próxima evolução é transformar o Workspace e a navegação investigativa em produto real, preservando a fundação técnica sem carregar a identidade do projeto anterior.
