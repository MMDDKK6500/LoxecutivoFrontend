import React, { useState } from 'react';
import type { Passageiro, Viagens } from '../../types';
import { FiCheck, FiX } from 'react-icons/fi';
import { digitsOnly, formatCpf, formatPhone, formatRg } from '../../utils/masks';

interface ModalPassageiroProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (passageiro: Passageiro) => void;
  viagemAtual: Viagens;
  passageiroEdit?: Passageiro | null;
}

export default function ModalPassageiro({ isOpen, onClose, onSave, viagemAtual, passageiroEdit }: ModalPassageiroProps) {
  const [nome, setNome] = useState(passageiroEdit?.nome ?? '');
  const [sobrenome, setSobrenome] = useState(passageiroEdit?.sobrenome ?? '');
  const [numero, setNumero] = useState(digitsOnly(passageiroEdit?.numero ?? '', 11));
  const [empresa, setEmpresa] = useState(passageiroEdit?.empresa ?? '');
  const [rg, setRg] = useState(digitsOnly(passageiroEdit?.rg ?? '', 9));
  const [cpf, setCpf] = useState(digitsOnly(passageiroEdit?.cpf ?? '', 11));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: passageiroEdit?.id,
      nome, sobrenome, numero, empresa, rg, cpf,
      idViagem: viagemAtual
    });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>{passageiroEdit ? 'Editar Passageiro' : 'Adicionar Passageiro'}</h2>
          <button type="button" className="close-btn" aria-label="Fechar" title="Fechar" onClick={onClose}><FiX /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Nome:</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={30} pattern="[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '\u002D]*" required />
            </div>
            <div className="form-group half-width">
              <label>Sobrenome:</label>
              <input type="text" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} maxLength={60} pattern="[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '\u002D]*" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Contato (Telefone):</label>
              <input type="tel" inputMode="numeric" autoComplete="tel" value={formatPhone(numero)} onChange={(e) => setNumero(digitsOnly(e.target.value, 11))} maxLength={15} pattern="\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}" placeholder="(11) 99999-9999" title="Informe um telefone com DDD." required />
            </div>
            <div className="form-group half-width">
              <label>Empresa:</label>
              <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} maxLength={60} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label>RG:</label>
              <input type="text" inputMode="numeric" maxLength={12} pattern="[0-9]{2}\.[0-9]{3}\.[0-9]{3}-[0-9]" value={formatRg(rg)} onChange={(e) => setRg(digitsOnly(e.target.value, 9))} placeholder="55.226.568-8" title="O RG deve ter 9 números." required />
            </div>
            <div className="form-group half-width">
              <label>CPF:</label>
              <input type="text" inputMode="numeric" maxLength={14} pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}" value={formatCpf(cpf)} onChange={(e) => setCpf(digitsOnly(e.target.value, 11))} placeholder="390.914.958-80" title="O CPF deve ter 11 números." required />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}><FiX /> Cancelar</button>
            <button type="submit" className="btn btn-save"><FiCheck /> {passageiroEdit ? 'Guardar alterações' : 'Confirmar passageiro'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
