interface ServiceCopy {
  capability: string;
  unavailable: string;
  recovered: string;
}

const SERVICE_COPY: Record<string, ServiceCopy> = {
  'loxecutivo-core': {
    capability: 'eventos, viagens e cadastros',
    unavailable: 'Os dados do sistema estão temporariamente indisponíveis. Eventos, viagens e cadastros podem não carregar. Tente novamente em alguns instantes.',
    recovered: 'O acesso aos dados do sistema voltou ao normal.',
  },
  'loxecutivo-auth': {
    capability: 'acesso à conta',
    unavailable: 'O acesso ao sistema está temporariamente indisponível. Novos logins podem não funcionar. Tente novamente em alguns instantes.',
    recovered: 'O acesso ao sistema voltou ao normal.',
  },
  'loxecutivo-export': {
    capability: 'geração e download de relatórios',
    unavailable: 'A geração e o download de relatórios estão temporariamente indisponíveis. As demais funções continuam disponíveis.',
    recovered: 'A geração e o download de relatórios voltaram ao normal.',
  },
};

export function unavailableServicesMessage(serviceNames: string[]) {
  if (serviceNames.length === 1) {
    return SERVICE_COPY[serviceNames[0]]?.unavailable
      ?? 'Uma parte do sistema está temporariamente indisponível. Tente novamente em alguns instantes.';
  }

  const capabilities = serviceNames.map(
    (name) => SERVICE_COPY[name]?.capability ?? 'outras funções',
  );

  return `Algumas funções estão temporariamente indisponíveis: ${capabilities.join(', ')}. Você pode continuar usando as demais áreas e tentar novamente em alguns instantes.`;
}

export function recoveredServicesMessage(serviceNames: string[]) {
  if (serviceNames.length === 1) {
    return SERVICE_COPY[serviceNames[0]]?.recovered
      ?? 'A função que estava indisponível voltou ao normal.';
  }

  return 'As funções que estavam temporariamente indisponíveis voltaram ao normal.';
}
