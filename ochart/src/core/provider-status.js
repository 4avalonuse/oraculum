const PROVIDERS = {
  yahoo: 'Yahoo Finance',
  binance: 'Binance',
  'binance-us': 'Binance.US'
};

export function providerName(provider) {
  return PROVIDERS[String(provider || '').toLowerCase()] || provider || 'Data API';
}

export function userError(error) {
  if (error?.code === 'REGION_RESTRICTED' || error?.httpStatus === 451) {
    return {
      title: 'Fonte indisponível',
      detail: `${providerName(error.provider)} não está disponível para esta conexão/região.`,
      status: 'Fonte indisponível'
    };
  }

  if (error?.code === 'dataset_not_found') {
    return {
      title: 'Série não encontrada',
      detail: 'Este mercado não está disponível na Data API.',
      status: 'Série indisponível'
    };
  }

  if (error?.message === 'tempo limite da Data API') {
    return {
      title: 'Data API sem resposta',
      detail: 'A conexão demorou mais que o esperado. Tente atualizar novamente.',
      status: 'Tempo limite'
    };
  }

  return {
    title: 'Não foi possível carregar',
    detail: 'A Data API não conseguiu entregar esta série agora.',
    status: 'Erro de dados'
  };
}
