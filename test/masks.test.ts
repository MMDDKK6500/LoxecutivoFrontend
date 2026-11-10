import { describe, expect, it } from 'vitest';
import { digitsOnly, formatCpf, formatPhone, formatRg } from '../src/utils/masks';

describe('máscaras de documentos e telefone', () => {
  it('remove caracteres e limita a quantidade de dígitos', () => {
    expect(digitsOnly('abc 390.914-958/80', 11)).toBe('39091495880');
  });
  it('formata CPF progressivamente e completo', () => {
    expect(formatCpf('39091495880')).toBe('390.914.958-80');
    expect(formatCpf('390914')).toBe('390.914');
  });
  it('formata RG com nove dígitos', () => {
    expect(formatRg('552265688')).toBe('55.226.568-8');
  });
  it('formata telefones fixos e celulares', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });
});
