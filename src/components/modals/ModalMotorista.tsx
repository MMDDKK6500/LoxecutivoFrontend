import React, { useState } from 'react';
import type { Motorista } from '../../types';

interface ModalMotoristaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (motorista: Motorista) => void;
  motoristaEdit?: Motorista | null;
}

export default function ModalMotorista({ isOpen, onClose, onSave, motoristaEdit }: ModalMotoristaProps) {
  const [nome, setNome] = useState(motoristaEdit?.nome ?? '');
  const [sobrenome, setSobrenome] = useState(motoristaEdit?.sobrenome ?? '');
  const [rg, setRg] = useState(motoristaEdit?.rg ?? '');
  const [cpf, setCpf] = useState(motoristaEdit?.cpf ?? '');

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
              <label>RG (Apenas números):</label>
              <input type="text" maxLength={9} pattern="[0-9]{9}" value={rg} onChange={(e) => setRg(e.target.value.replace(/\D/g, ''))} title="O RG deve ter 9 números." required />
            </div>
            <div className="form-group half-width">
              <label>CPF (Apenas números):</label>
              <input type="text" maxLength={11} pattern="[0-9]{11}" value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))} title="O CPF deve ter 11 números." required />
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
