import { describe, expect, it } from 'vitest';
import { recoveredServicesMessage, unavailableServicesMessage } from '../src/utils/serviceHealthMessages';

describe('mensagens de disponibilidade dos serviços', () => {
  it('explica a indisponibilidade dos dados sem expor o nome técnico do serviço', () => {
    const message = unavailableServicesMessage(['loxecutivo-core']);

    expect(message).toContain('Eventos, viagens e cadastros');
    expect(message).not.toContain('core');
  });

  it('informa que somente os relatórios foram afetados', () => {
    const message = unavailableServicesMessage(['loxecutivo-export']);

    expect(message).toContain('relatórios');
    expect(message).toContain('demais funções continuam disponíveis');
  });

  it('resume as funções afetadas quando há mais de uma indisponibilidade', () => {
    const message = unavailableServicesMessage(['loxecutivo-core', 'loxecutivo-auth']);

    expect(message).toContain('eventos, viagens e cadastros');
    expect(message).toContain('acesso à conta');
  });

  it('confirma a recuperação com uma mensagem orientada ao usuário', () => {
    expect(recoveredServicesMessage(['loxecutivo-auth']))
      .toBe('O acesso ao sistema voltou ao normal.');
  });
});
