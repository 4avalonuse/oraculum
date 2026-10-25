# Oraculum — Visão do Laboratório Científico e Plano de Evolução

> Documento de alinhamento — 25 de outubro de 2026. Proposta de produto e arquitetura; não representa funcionalidades já implementadas.

## 1. Objetivo
Transformar o Oraculum de uma interface centrada em gráficos e execução de análises em um **laboratório de investigação científica de mercados**, capaz de descobrir, testar, explicar, registrar e revisitar padrões. A ciência precede a interpretação e qualquer aplicação operacional.

## 2. Princípios acordados
- **Investigar padrões, não apenas ativos.** Cada padrão possui identidade, ocorrências, condições, evolução histórica, evidências favoráveis e contrárias.
- **Do todo ao uno e do uno ao todo.** Navegação livre entre panorama de mercado, ativo, variável, padrão, ocorrência, evento e contexto macroeconômico.
- **Exploração livre; validação rigorosa.** Uma descoberta é hipótese candidata até superar testes independentes.
- **Associação não é causalidade.** Distinguir força estatística, explicação possível e evidência causal; não inventar narrativas ou confiança numérica.
- **Reprodutibilidade.** Registrar fontes, disponibilidade temporal dos dados, parâmetros, transformações, versões, testes e resultados, inclusive negativos ou inconclusivos.
- **Modularidade.** Módulos pequenos, responsabilidade única, interfaces explícitas e lógica científica independente da UI.
- **Reaproveitamento incremental.** Preservar capacidades existentes; evitar reescrita integral sem auditoria.

## 3. Experiência proposta
### Navegação superior
**Laboratório | Padrões | Investigações | Histórico**

### Coluna esquerda — ponto de entrada
Escolher ativo (ex.: Bitcoin), conjunto de mercados, variável econômica, padrão ou investigação salva. Não impor uma única sequência de exploração.

### Centro — mesa de investigação
Exibir a pergunta de pesquisa, séries comparadas, timelines, padrões candidatos, testes, resultados e evidências contrárias. O gráfico auxilia a investigação, não define sua estrutura.

### Painel direito — compreensão progressiva
Ao selecionar um resultado ou padrão, oferecer **Entender**, **Evidências** e **Contexto**: explicação acessível, método e fórmulas quando solicitados, fontes, limitações e contexto histórico.

### Caminhos e ramificações
Trilha navegável, por exemplo: **Bitcoin → Padrão de liquidez → Relação com juros**. Permitir aprofundar, voltar, criar ramificações e comparar hipóteses sem perder a origem.

### Mobile
Uma área principal por vez, com navegação recolhível e painel de detalhes expansível.

## 4. Duas memórias complementares
**Histórico de navegação:** telas, seleções, comparações, períodos, caminhos e ramificações exploradas.

**Histórico científico:** hipótese original, dados e horários de disponibilidade, versões, método, parâmetros, transformações, testes, resultados, refutações e conclusões. Uma investigação é um workspace persistente; padrões podem ser reutilizados em várias investigações sem duplicação desnecessária.

## 5. Biblioteca viva de padrões
Registrar padrões candidatos e validados, suas ocorrências, regimes de mercado, condições de persistência ou desaparecimento, contradições e revisões. Padrões podem reforçar-se, enfraquecer-se ou conflitar; preservar seu ciclo de vida e a proveniência de cada afirmação.

## 6. Ciência e validação
Separar **descoberta** de **validação independente**. A peneira científica deve abordar, conforme o método:
- viés de seleção e múltiplas comparações;
- sobreajuste e validação fora da amostra;
- vazamento temporal e *look-ahead bias*;
- robustez por períodos e regimes;
- sensibilidade a parâmetros e qualidade dos dados;
- resultados negativos, inconclusivos e limites de generalização.

Não atribuir causalidade apenas a correlação. Contexto qualitativo (econômico, político e geopolítico) pode orientar novas hipóteses, mas deve respeitar o que era conhecido em cada data histórica.

## 7. Componentes existentes a preservar e revisar
- Timelines e segundo gráfico de comparação: preservar e reposicionar como ferramentas do laboratório.
- Comparação do mesmo ativo em múltiplas instâncias e períodos.
- Duração visível uniforme entre timelines, com deslocamento temporal independente; revisar a semântica atual do redimensionamento antes de alterar.
- Seleção de ativos, cálculos estatísticos e mecanismos de análise/testes: auditar e extrair da camada visual quando necessário.
- Reduzir protagonismo do primeiro gráfico e eliminar a seção isolada de eventos na UI; **não** eliminar eventos do modelo de contexto.

O reaproveitamento efetivo depende de auditoria do código e testes, não de uma porcentagem presumida.

## 8. Fronteiras entre produtos
- **Oraculum:** investigação, hipóteses, validação, contexto e memória científica.
- **Ochama:** visualização financeira avançada; abrir com ativo e intervalo selecionados.
- **OAlgo:** geração de algoritmos, em fase posterior.
- **OBacktest:** testes históricos de estratégias, sem confundir desempenho operacional com evidência científica.
- **OWin:** execução, em escopo próprio.

Integrações por contratos claros, sem acumular funcionalidades alheias no Oraculum.

## 9. Ordem de implementação
1. **Auditoria da `main`:** mapear componentes, dependências, testes e comportamento real.
2. **Backup antes de mudanças estruturais:** ponto de retorno verificável.
3. **Contratos e modelos de domínio:** workspace, hipótese, padrão, ocorrência, evidência, teste, resultado, contexto e proveniência.
4. **Nova casca do laboratório:** navegação e composição progressiva dos componentes existentes.
5. **Separação UI/motor científico:** testes reproduzíveis, dados e resultados estruturados.
6. **Persistência:** histórico de navegação e histórico científico, incluindo ramificações.
7. **Biblioteca de padrões e validação independente:** começar por padrões quantitativos e contexto qualitativo; permitir futuramente investigação iniciada por eventos.
8. **Integração com Ochama e evolução posterior:** somente após contratos estáveis.

Cada etapa deve ter critérios de aceitação, testes e verificação manual.

## 10. Fluxo de desenvolvimento
- Trabalhar diretamente na **`main`**, sem branch permanente de desenvolvimento; backup opcional antes de mudanças maiores.
- Testar a versão publicada no **GitHub Pages**, respeitando o tempo de implantação.
- Preferir alterações pequenas, reversíveis e verificáveis.
- Documentar decisões, limitações e próximos passos.
- Usar agentes apenas quando agregarem valor claro, minimizando custos.
- **Prazo de referência:** aproximadamente um mês para a primeira fase, sujeito ao escopo validado.

## 11. Critérios de sucesso da primeira fase
Um usuário consegue iniciar uma investigação, comparar períodos e variáveis, navegar entre escalas, obter hipóteses com evidências e contraindicações, entender os testes e suas limitações, salvar e retomar o percurso e reproduzir o resultado. A UI não deve sugerir que um padrão exploratório já é uma descoberta confirmada.

## 12. Questões a validar na auditoria
- Como o estado das timelines representa instâncias repetidas do mesmo ativo?
- Quais funções de análise estão acopladas à interface?
- Que testes automatizados existem e quais faltam?
- Como versionar datasets e preservar o instante em que cada dado estava disponível?
- Qual infraestrutura de persistência pode ser reaproveitada sem comprometer a reprodutibilidade?

**Status:** visão acordada; implementação da nova experiência ainda não iniciada neste documento.
