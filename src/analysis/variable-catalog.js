/* ORACULUM — catálogo canônico de variáveis analíticas.
 * IDs estáveis para reutilização entre interface, relatórios, investigações e,
 * futuramente, OAlgo/OBacktest. Este arquivo descreve métricas; não calcula
 * valores nem persiste resultados.
 *
 * Convenção: valores estatísticos indefinidos permanecem NaN/null na camada
 * consumidora; não os converter silenciosamente em zero.
 */
const variable = (id, label, domain, unit, definition, formula, source, requirements = [], cautions = []) => ({
  id, label, domain, unit, definition, formula, source,
  requirements, cautions
});

export const VARIABLE_CATALOG = Object.freeze([
  variable('price_start','Preço inicial','price','currency','Primeiro preço válido da amostra ordenada.','P₀','engine.analyzeSeries',['prices aligned to selected period']),
  variable('price_end','Preço final','price','currency','Último preço válido da amostra ordenada.','Pₜ','engine.analyzeSeries',['prices aligned to selected period']),
  variable('return_total','Retorno acumulado','performance','ratio','Variação percentual entre o primeiro e o último preço.','Pₜ / P₀ − 1','engine.analyzeSeries',['positive start and end prices']),
  variable('return_cagr','CAGR','performance','annualized_ratio','Taxa anual composta equivalente no horizonte observado.','(Pₜ / P₀)^(1/anos) − 1','engine.cagr',['positive start/end prices','elapsed time > 0'],['Depende da convenção de anos usada.']),
  variable('return_mean','Média dos retornos','distribution','return_per_interval','Média aritmética dos retornos válidos por intervalo.','Σrᵢ / n','descriptive.describe',['at least one finite return']),
  variable('return_median','Mediana dos retornos','distribution','return_per_interval','Quantil 50% dos retornos válidos.','Q₀.₅(r)','descriptive.describe',['at least one finite return']),
  variable('return_variance','Variância amostral','distribution','return_squared','Dispersão amostral dos retornos em torno da média.','Σ(rᵢ − r̄)² / (n − 1)','descriptive.variance',['at least 2 finite returns']),
  variable('return_std','Desvio-padrão amostral','distribution','return_per_interval','Raiz quadrada da variância amostral dos retornos.','√Var(r)','descriptive.describe',['at least 2 finite returns']),
  variable('return_se','Erro-padrão da média','inference','return_per_interval','Estimativa do erro-padrão da média amostral sob pressupostos usuais.','s / √n','descriptive.standardError',['at least 2 finite returns'],['Dependência temporal pode tornar a fórmula clássica inadequada.']),
  variable('return_min','Menor retorno','distribution','return_per_interval','Menor retorno observado no intervalo.','min(r)','descriptive.describe',['finite returns']),
  variable('return_max','Maior retorno','distribution','return_per_interval','Maior retorno observado no intervalo.','max(r)','descriptive.describe',['finite returns']),
  variable('return_q05','Quantil 5%','tail_risk','return_per_interval','Limiar abaixo do qual ficam aproximadamente 5% dos retornos, segundo interpolação linear.','Q₀.₀₅(r)','descriptive.describe',['finite returns']),
  variable('return_q25','Quantil 25%','distribution','return_per_interval','Primeiro quartil dos retornos.','Q₀.₂₅(r)','engine.analyzeSeries',['finite returns']),
  variable('return_q75','Quantil 75%','distribution','return_per_interval','Terceiro quartil dos retornos.','Q₀.₇₅(r)','engine.analyzeSeries',['finite returns']),
  variable('return_q95','Quantil 95%','tail_risk','return_per_interval','Limiar do percentil 95 dos retornos.','Q₀.₉₅(r)','descriptive.describe',['finite returns']),
  variable('return_skewness','Assimetria','distribution','dimensionless','Assimetria amostral corrigida da distribuição dos retornos.','estimador corrigido de skewness','descriptive.skewness',['at least 3 finite returns','positive standard deviation']),
  variable('return_excess_kurtosis','Curtose excedente','distribution','dimensionless','Curtose excedente: referência normal igual a zero, com correção amostral.','estimador corrigido de curtose − 3','descriptive.kurtosis',['at least 4 finite returns','positive standard deviation']),
  variable('return_jarque_bera','Jarque–Bera','diagnostic','test_statistic','Estatística de teste exploratória de normalidade baseada em assimetria e curtose.','n / 6 · (S² + K² / 4)','descriptive.jarqueBera',['at least 8 finite returns'],['p-valor assintótico; normalidade não é requisito universal para descrever retornos.']),
  variable('volatility_annualized','Volatilidade anualizada','risk','annualized_ratio','Desvio-padrão amostral dos retornos multiplicado pela raiz dos períodos anuais.','s(r) · √m','engine.analyzeSeries',['finite returns','interval annualization convention'],['A anualização pressupõe uma convenção de frequência; não garante volatilidade futura.']),
  variable('drawdown_max','Drawdown máximo','risk','negative_ratio','Maior queda percentual de um pico anterior até um vale posterior.','min(Pₜ / max(P₀…Pₜ) − 1)','engine.drawdown',['ordered positive prices']),
  variable('drawdown_recovery_intervals','Tempo de recuperação do drawdown','risk','interval_count','Número de observações entre o vale do drawdown máximo e a recuperação do pico associado.','índice de recuperação − índice do vale','engine.drawdown',['ordered positive prices'],['null significa que o pico ainda não foi recuperado; unidade depende do intervalo.']),
  variable('sharpe_ratio','Índice de Sharpe','risk','annualized_ratio','Retorno médio excedente ao livre de risco dividido pelo desvio-padrão, anualizado.','(média(r − rf) / s(r − rf)) · √m','risk.sharpeRatio',['at least 2 finite returns','annualization periods'],['Taxa livre de risco padrão é zero se não configurada.']),
  variable('sortino_ratio','Índice de Sortino','risk','annualized_ratio','Retorno excedente ao alvo dividido pelo desvio-padrão downside, anualizado.','(média(r) − alvo) / downside deviation · √m','risk.sortinoRatio',['finite returns','annualization periods'],['O resultado depende do alvo downside configurado.']),
  variable('downside_deviation','Desvio downside','risk','return_per_interval','Raiz da média dos quadrados das diferenças negativas em relação ao alvo.','√mean(min(r − alvo, 0)²)','risk.downsideDeviation',['finite returns']),
  variable('var_95_historical','VaR histórico 95%','tail_risk','loss_ratio','Estimativa histórica de perda no quantil inferior de 5% dos retornos.','−Q₀.₀₅(r)','risk.historicalVaR',['finite returns'],['Não é perda máxima; depende da amostra e do método histórico.']),
  variable('var_99_historical','VaR histórico 99%','tail_risk','loss_ratio','Estimativa histórica de perda no quantil inferior de 1% dos retornos.','−Q₀.₀₁(r)','risk.historicalVaR',['finite returns'],['Amostras curtas estimam mal caudas extremas.']),
  variable('es_95_historical','Expected Shortfall 95%','tail_risk','loss_ratio','Perda média na cauda inferior além do VaR histórico de 95%, com ponderação fracionária no corte.','−E[r | cauda inferior de 5%]','risk.expectedShortfall',['sufficient tail observations'],['A interpretação depende do método e da amostra.']),
  variable('es_99_historical','Expected Shortfall 99%','tail_risk','loss_ratio','Perda média na cauda inferior além do VaR histórico de 99%.','−E[r | cauda inferior de 1%]','risk.expectedShortfall',['sufficient tail observations'],['Amostras curtas são particularmente frágeis para esta métrica.']),
  variable('calmar_ratio','Índice de Calmar','risk','ratio','CAGR dividido pela magnitude do drawdown máximo.','CAGR / |drawdown máximo|','risk.calmar',['CAGR finite','negative max drawdown']),
  variable('win_rate','Taxa de retornos positivos','distribution','ratio','Proporção dos retornos válidos maiores que zero.','count(r > 0) / n','engine.analyzeSeries',['finite returns']),
  variable('best_return','Melhor retorno por intervalo','tail_risk','return_per_interval','Maior retorno válido por intervalo na amostra.','max(r)','engine.analyzeSeries',['finite returns']),
  variable('worst_return','Pior retorno por intervalo','tail_risk','return_per_interval','Menor retorno válido por intervalo na amostra.','min(r)','engine.analyzeSeries',['finite returns']),
  variable('price_ath','Máxima histórica observada','price','currency','Maior preço da amostra selecionada.','max(P)','engine.analyzeSeries',['finite prices']),
  variable('price_atl','Mínima histórica observada','price','currency','Menor preço da amostra selecionada.','min(P)','engine.analyzeSeries',['finite prices']),
  variable('correlation_pearson','Correlação de Pearson','relationship','dimensionless','Associação linear padronizada entre duas séries pareadas.','Cov(X,Y) / (sₓ · sᵧ)','engine.corr',['at least 2 paired finite observations','non-constant series'],['Associação não implica causalidade; sensível a outliers.']),
  variable('covariance_sample','Covariância amostral','relationship','product_of_units','Movimento conjunto em unidades dependentes das séries.','Σ(xᵢ − x̄)(yᵢ − ȳ) / (n − 1)','engine.cov',['at least 2 paired finite observations']),
  variable('beta_ols','Beta OLS','relationship','dimensionless','Inclinação da regressão do retorno-alvo sobre o retorno de referência.','Cov(r_ref, r_target) / Var(r_ref)','engine.regression',['paired returns','positive reference variance'],['Não é causalidade; depende da referência e da janela.']),
  variable('alpha_ols_per_interval','Alpha OLS por intervalo','relationship','return_per_interval','Intercepto da regressão simples dos retornos do alvo sobre a referência.','média(r_target) − β · média(r_ref)','engine.regression',['paired returns'],['Não anualizado; não equivale automaticamente a alpha financeiro ajustado por fatores.']),
  variable('r_squared_ols','R² OLS simples','relationship','ratio','Quadrado da correlação na regressão simples com intercepto.','Corr(X,Y)²','engine.regression',['paired returns']),
  variable('correlation_rolling_latest','Correlação móvel mais recente','relationship','dimensionless','Correlação de Pearson na última janela móvel válida.','Corr(X[t−w+1:t], Y[t−w+1:t])','engine.rollingCorrelation',['window-sized paired return series'],['Resultado depende do tamanho da janela.']),
  variable('lead_lag_best','Defasagem de maior correlação absoluta','relationship','interval_count','Defasagem exploratória entre −5 e +5 intervalos que maximiza a correlação absoluta.','argmaxₗ |Corr(Xₜ, Yₜ₊ₗ)|','engine.leadLag',['sufficient paired returns'],['Exploratório; múltiplas defasagens aumentam risco de achado espúrio.']),
  variable('ols_adjusted_r_squared','R² ajustado','econometrics','ratio','R² ajustado pela quantidade de parâmetros do modelo.','1 − (1 − R²)(n − 1)/(n − k)','explanatory-model.ols',['OLS estimable sample']),
  variable('ols_coefficient_se','Erro-padrão do coeficiente OLS','econometrics','coefficient_unit','Erro-padrão clássico de cada coeficiente estimado.','√diag(σ²(X′X)⁻¹)','explanatory-model.ols',['full-rank design matrix'],['Pressupostos clássicos podem falhar em séries temporais.']),
  variable('ols_hac_se','Erro-padrão HAC Newey–West','econometrics','coefficient_unit','Erro-padrão robusto à heterocedasticidade e autocorrelação segundo a largura de banda configurada.','√diag((X′X)⁻¹ S_HAC (X′X)⁻¹)','explanatory-model.hacCovariance',['full-rank design matrix','HAC lag choice'],['Inferência sensível à escolha de defasagens.']),
  variable('ols_p_value','p-valor do coeficiente OLS','econometrics','probability','Probabilidade de cauda do teste t sob a hipótese nula e o modelo inferencial adotado.','teste t bilateral','explanatory-model.ols',['coefficient standard error','degrees of freedom'],['Não é a probabilidade de a hipótese nula ser verdadeira.']),
  variable('ols_vif','Fator de inflação da variância','econometrics','ratio','Quantifica quanto a colinearidade linear entre preditores infla a variância do coeficiente.','1 / (1 − R²ⱼ)','explanatory-model.vifValues',['at least 2 predictors']),
  variable('residual_durbin_watson','Durbin–Watson','diagnostic','ratio','Diagnóstico de autocorrelação serial de primeira ordem nos resíduos.','Σ(eₜ − eₜ₋₁)² / Σeₜ²','model-diagnostics.diagnoseModel',['ordered model residuals'],['Regra de bolso não substitui inferência apropriada.']),
  variable('residual_ljung_box_p','p-valor Ljung–Box','diagnostic','probability','Teste conjunto de autocorrelação dos resíduos até o número de defasagens escolhido.','aproximação qui-quadrado','model-diagnostics.diagnoseModel',['sufficient ordered residuals'],['Escolha de defasagens e estimação prévia afetam o teste.']),
  variable('price_real_cpi_deflated','Preço deflacionado por CPI','macro','currency_in_base_period','Preço nominal convertido em poder de compra do período-base do CPI selecionado.','P_nominal × CPI_base / CPI_t','engine.deflateValues',['matched CPI observation','positive CPI values'],['Só é calculado quando há observação de CPI no timestamp; base depende da série disponível.']),
  variable('return_real_cpi_adjusted','Retorno real por CPI','macro','ratio','Retorno entre preços ajustados por índices de preços inicial e final.','(Pₜ/CPIₜ) / (P₀/CPI₀) − 1','engine.realReturn',['positive prices and CPI at both endpoints'])
]);

export const VARIABLE_BY_ID = Object.freeze(
  Object.fromEntries(VARIABLE_CATALOG.map(item => [item.id, item]))
);

export function getVariable(id) {
  return VARIABLE_BY_ID[id] || null;
}

export function listVariables({ domain, source } = {}) {
  return VARIABLE_CATALOG.filter(item =>
    (!domain || item.domain === domain) &&
    (!source || item.source === source)
  );
}
