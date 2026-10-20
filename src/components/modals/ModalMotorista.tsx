import React, { useState } from 'react';
import type { Motorista } from '../../types';
import { digitsOnly, formatCpf, formatRg } from '../../utils/masks';

interface ModalMotoristaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (motorista: Motorista) => void;
  motoristaEdit?: Motorista | null;
}

export default function ModalMotorista({ isOpen, onClose, onSave, motoristaEdit }: ModalMotoristaProps) {
  const [nome, setNome] = useState(motoristaEdit?.nome ?? '');
  const [sobrenome, setSobrenome] = useState(motoristaEdit?.sobrenome ?? '');
  const [rg, setRg] = useState(digitsOnly(motoristaEdit?.rg ?? '', 9));
  const [cpf, setCpf] = useState(digitsOnly(motoristaEdit?.cpf ?? '', 11));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: motoristaEdit?.id, nome, sobrenome, rg, cpf });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{motoristaEdit ? 'Editar Motorista' : 'Novo Motorista'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Nome:</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={30} pattern="[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '\u002D]*" title="Informe um nome válido." required />
            </div>
            <div className="form-group half-width">
              <label>Sobrenome:</label>
              <input type="text" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} maxLength={60} pattern="[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '\u002D]*" title="Informe um sobrenome válido." required />
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
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-save">Salvar Motorista</button>
          </div>
        </form>
      </div>
    </div>
  );
}   
