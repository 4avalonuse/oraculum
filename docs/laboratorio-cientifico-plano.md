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


## 13. Timelines inteligentes e elegibilidade científica — decisão de produto (25/10/2026)

**Princípio de UX:** a complexidade deve residir no motor, não na quantidade de controles. A timeline é o principal instrumento de construção da investigação. A interface permanece discreta, progressiva, intuitiva e poderosa; o sistema infere apenas o que os dados e as ações permitem inferir, sem presumir hipóteses ou modificar períodos sem consentimento.

### Fluxo da experiência
1. O pesquisador entra no gráfico de um ativo (por exemplo, BTC), com eventos históricos consultáveis, e adiciona quantas instâncias desejar, inclusive o mesmo ativo repetido em períodos diferentes.
2. A cada inclusão, remoção, seleção ou movimento de timeline, o sistema reavalia silenciosamente o contexto: identidade dos ativos e das instâncias, intervalos efetivos, interseção temporal, frequência, calendários, observações disponíveis, faltantes, qualidade e transformações.
3. A interface revela somente as ações pertinentes ao contexto. Selecionar timelines e acionar **Comparar selecionadas** cria uma comparação lógica sem obrigar o usuário a gerenciar “grupos” visíveis; uma timeline pode integrar várias comparações sem duplicar dados.
4. Sugestões discretas e opcionais podem propor “Comparar períodos históricos?”, “Comparar trajetórias?” ou “Organizar por ciclos de halving?” quando houver evidências contextuais. Reconhecimento de eventos é hipótese/sugestão, não inferência certa sobre a intenção.
5. O sistema não altera automaticamente datas, limites, duração, agrupamento ou transformação dos dados por ter inferido uma intenção. Ações que modificam a seleção exigem escolha explícita.

### Construtor de períodos e comportamento
- **Livre:** arrastar uma timeline desloca apenas sua janela, preservando o tamanho definido e respeitando os limites dos dados.
- **Janelas equivalentes:** permitir igualdade explícita por tempo de calendário ou por número de observações/frames, sem confundir os critérios. Para frequências diferentes, exigir política de alinhamento/reamostragem justificável ou sinalizar incompatibilidade.
- **Sequencial:** janelas adjacentes, sem lacunas ou sobreposições não intencionais; fronteiras compartilhadas têm regras de ajuste consistentes.
- **Por eventos:** fronteiras determinadas por eventos datados e documentados, como os halvings do Bitcoin. Ciclos ainda abertos são identificados como incompletos.
- **Trechos relativos:** comparar, por exemplo, os primeiros 180 ou 365 dias de cada ciclo; visualização em percentual de progresso do ciclo é transformação explícita e não substitui dados brutos.
- No modo livre/equivalente padrão, a primeira timeline pode controlar o redimensionamento das demais enquanto cada uma mantém seu posicionamento histórico, quando viável. Modos sequencial e por eventos possuem políticas próprias; não forçar uma única regra global de duração.
- Ao atingir limites, não encurtar amostras, completar observações fictícias ou deslocar silenciosamente outras janelas. Informar insuficiência de dados e as consequências.

### Motor de Elegibilidade Científica (independente da UI)
**Entrada:** estado das instâncias/timelines, comparação selecionada, metadados das séries, políticas de alinhamento, transformações, qualidade dos dados e requisitos explícitos de cada método.

**Saída por método:** `adequado`, `adequado_com_ressalvas` ou `inadequado`, com justificativa legível, pré-condições, ajustes possíveis e metadados para auditoria.

- Mesmo ativo em épocas distintas: comparação histórica de padrões, retornos, volatilidade e regimes conforme os pressupostos; não tratar janelas separadas como observações contemporâneas.
- Ativos diferentes no mesmo período: permitir associação contemporânea e modelos apropriados somente com alinhamento, tamanho amostral, dependência temporal e demais pressupostos verificados.
- Ativos diferentes em épocas distintas: permitir comparação de trajetórias/distribuições quando defensável; não apresentar correlação contemporânea sem sobreposição temporal.
- Tamanhos de amostra diferentes **não** invalidam toda estatística: a elegibilidade é específica do método. Comparação ponto a ponto requer correspondência explícita.
- Distinguir inviabilidade, condição corrigível e ressalva; não declarar causalidade a partir de correlação, nem selecionar métodos pelo resultado estatisticamente significativo.
- Métodos adequados aparecem no fluxo principal; condicionais mostram a exigência; inadequados não são oferecidos como ação principal, mas permanecem consultáveis com motivo e orientação para ajustar a seleção. Não ocultar evidências negativas.
- Mudanças nas timelines invalidam a atualidade dos resultados dependentes sem apagá-los do histórico. Visualizações leves podem acompanhar o arraste; testes pesados são executados por solicitação (ex.: **Analisar janelas**).
- Cada resultado registra instâncias, intervalos efetivos, frequência, contagens, política de alinhamento, transformações, método, versão e limitações para reprodução.

### Arquitetura modular sugerida
Separar `window-constructor` (políticas de janelas), `comparison-context` (inferência descritiva), `method-eligibility` (regras científicas testáveis), `method-catalog` (requisitos declarativos) e `timeline-suggestions` (UX contextual). Evitar acoplar essas responsabilidades ao atual `src/analysis/comparison.js`; nomes de módulos são provisórios.

### Testes e critérios de aceitação
Cobrir instâncias repetidas, movimento independente, redimensionamento compartilhado quando aplicável, fronteiras sequenciais, ciclos por eventos e ciclos incompletos, limites de dados, frequências divergentes, amostras desiguais, alinhamento temporal, mudanças de elegibilidade, preservação de resultados anteriores e justificativas dos bloqueios. Testar a interface progressiva no GitHub Pages.

**Estado:** decisão de produto e requisitos documentados; não declarar esses novos modos ou o motor de elegibilidade como já implementados.


## 14. Fluxo de tela da investigação — decisão de UX (25/10/2026)

**Objetivo:** uma experiência intuitiva, discreta e progressiva: começar pela exploração visual e revelar apenas as ações científicas pertinentes ao contexto atual. Não exigir que o pesquisador configure uma análise completa antes de começar.

### Ordem visual e interação
1. **Gráfico do ativo e contexto histórico:** ponto de entrada familiar (ex.: preço do Bitcoin), com eventos históricos acessíveis sem que a seção de eventos se torne uma segunda interface dominante.
2. **Mesa de timelines:** adicionar livremente ativos e instâncias repetidas; deslocar janelas, alterar períodos e escolher quais instâncias participarão da análise. Timelines **ativas** ficam destacadas; timelines **inativas** permanecem visíveis em estado discreto, “fantasma”, como referências. Ativar ou desativar deve ser simples e reversível.
3. **Ferramentas científicas contextuais:** o motor interpreta somente as timelines ativas para montar a comparação e determinar elegibilidade; as inativas não contaminam cálculos nem critérios amostrais. Sugestões e opções aparecem conforme seleção, sobreposição temporal, frequência, qualidade e pergunta de pesquisa, sem abrir painéis excessivos. Métodos inadequados ficam fora do fluxo principal, mas consultáveis com justificativa.
4. **Resultados abaixo das timelines, em camadas progressivas:**
   - **O que encontramos:** síntese factual, incluindo resultados negativos e inconclusivos, sem linguagem causal ou certeza indevida.
   - **Evidências:** métricas, gráficos, testes, intervalos de incerteza, pressupostos e limitações.
   - **Entender o resultado:** explicação sob demanda dos cálculos, método, adequação científica, fontes e transformações; permitir aprofundamento sem trocar de ambiente.

### Comportamento de estado
- Adicionar, remover, mover, redimensionar, ativar ou desativar uma timeline atualiza o **contexto e as ferramentas elegíveis**, mas não executa silenciosamente testes pesados nem reescreve conclusões.
- Resultados produzidos com seleção anterior permanecem no histórico com indicação clara de **seleção anterior / desatualizado**, sem serem apresentados como resultados da configuração atual.
- Timelines inativas continuam na tela, podem ser reativadas com um clique e não são apagadas, descartadas ou confundidas com dados ausentes.
- Comparações lógicas podem envolver subconjuntos de timelines; não exigir criação ou gerenciamento explícito de “grupos” na UI.
- Uma sugestão do sistema é uma **possibilidade de investigação**, nunca uma descoberta comprovada nem uma alteração automática da seleção.

### Critérios de aceitação de UX
Um usuário deve conseguir: abrir o gráfico; adicionar BTC, ETH ou BTC repetido; montar períodos; ativar somente algumas timelines; visualizar outras como referência; entender quais métodos são permitidos e por quê; executar análise; ler síntese, evidências e explicação; modificar seleção sem perder resultados anteriores. Validar o fluxo manualmente no GitHub Pages e com testes de estado/elegibilidade antes de ampliar a quantidade de controles.

**Estado:** fluxo e comportamento especificados; ainda não implementados integralmente.


## 15. Eventos históricos — controle explícito e camada compartilhada (25/10/2026)

### Problema identificado
Na experiência atual, eventos aparecem previamente marcados e os grupos carecem de controles práticos de seleção em massa. Isso causa sobretudo a sensação de que há coisas **ativas sem solicitação**, além de poluição visual. Não confundir marcador visível com participação efetiva em cálculo.

### Decisões de interação
- **Nenhum evento inicia ativo para análise** por padrão. Participação científica requer escolha explícita e reversível do pesquisador.
- Separar dois estados independentes: **visibilidade no gráfico** e **inclusão na análise**. “Selecionar todos” para visualização nunca seleciona eventos para cálculos.
- Manter a organização por categorias/grupos existentes, aprimorando-a com **Selecionar todos**, **Limpar seleção** e seleção individual; ações deixam claro se afetam visibilidade ou participação analítica.
- O clique no marcador do gráfico é a interação principal para inspecionar nome, data, fonte e contexto, com opção explícita de usar o evento na investigação. Um filtro de categorias pode ficar recolhido por padrão para não sobrecarregar a interface.
- Preservar as escolhas do usuário durante a investigação; alterar período, adicionar ativo ou mover timeline não reativa eventos que foram desativados. Quando um evento deixa de estar no período, manter a preferência sem considerá-lo elegível naquela janela.
- Representar discretamente três situações: evento disponível/visível como contexto, evento escolhido como candidato à investigação e evento efetivamente usado por uma análise executada. Os estados não são equivalentes.

### Integração dos gráficos e rigor científico
- Eventos formam uma **camada temporal compartilhada**, não uma função exclusiva do gráfico principal. O gráfico comparativo pode mostrar referências discretas nas timelines pertinentes, especialmente para eventos escolhidos, evitando replicar todos os marcadores indiscriminadamente.
- Distinguir eventos pontuais e intervalos prolongados; quando relevante, separar data de anúncio, implementação e disponibilidade da informação ao mercado.
- A escolha do evento não determina automaticamente o método: permitir perguntas distintas, como janela antes/depois, ciclos entre eventos e alinhamento relativo a eventos, sob verificação do motor de elegibilidade.
- Validar cobertura e amostras antes/depois, sobreposição entre eventos, vieses temporais, múltiplos testes e fatores concorrentes. Não interpretar reação posterior como prova de causalidade.
- Regras de seleção e metadados de eventos devem ser independentes dos componentes visuais e cobertos por testes.

### Aceitação
Ao abrir uma investigação, nenhum evento participa de análises sem ação explícita. O pesquisador pode exibir/ocultar eventos por grupo, limpar e selecionar todos para **visualização** sem afetar o conjunto analítico, ativar eventos específicos para investigação e vê-los contextualizados no segundo gráfico quando pertinente. As escolhas persistem durante mudanças de timeline, sem reativação silenciosa.

**Estado:** requisitos documentados; não representam comportamento já implementado.


## Nota de escopo: Spacework (conceito separado)

O **Spacework** é uma proposta ainda exploratória de ambiente de investigação visual e sistêmica, distinta do laboratório científico do Oraculum. As ideias de prancheta 2D, gráficos independentes/sobrepostos, sincronização temporal flexível, eventos compartilhados e futuras camadas de relações estão registradas em [Spacework — conceito exploratório](spacework-conceito-exploratorio.md). **Não considerar esta referência autorização para implementar o Spacework ou ampliar automaticamente o escopo do Oraculum.**
