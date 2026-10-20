import React, { useState, useEffect } from 'react';
import type { Motorista } from '../../types';

interface ModalMotoristaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (motorista: Motorista) => void;
  motoristaEdit?: Motorista | null;
}

export default function ModalMotorista({ isOpen, onClose, onSave, motoristaEdit }: ModalMotoristaProps) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');

  useEffect(() => {
    if (motoristaEdit) {
      setNome(motoristaEdit.nome); setSobrenome(motoristaEdit.sobrenome);
      setRg(motoristaEdit.rg); setCpf(motoristaEdit.cpf);
    } else {
      setNome(''); setSobrenome(''); setRg(''); setCpf('');
    }
  }, [motoristaEdit, isOpen]);

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
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="form-group half-width">
              <label>Sobrenome:</label>
              <input type="text" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label>RG (Apenas números):</label>
              <input type="text" maxLength={9} value={rg} onChange={(e) => setRg(e.target.value.replace(/\D/g, ''))} required />
            </div>
            <div className="form-group half-width">
              <label>CPF (Apenas números):</label>
              <input type="text" maxLength={11} value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))} required />
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