import React, { useState } from 'react';
import type { Endereco } from '../../types';

interface ModalEnderecoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (endereco: Endereco) => void;
}

export default function ModalEndereco({ isOpen, onClose, onSave }: ModalEnderecoProps) {
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState<number | ''>('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (numero === '') return;
    onSave({ rua, numero: Number(numero), bairro, cidade, uf: uf.toUpperCase() });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>Novo Endereço</h2>
          <button type="button" className="close-btn" aria-label="Fechar" title="Fechar" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="endereco-rua">Logradouro:</label>
            <input id="endereco-rua" value={rua} onChange={(e) => setRua(e.target.value)} maxLength={50} required />
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="endereco-numero">Número:</label>
              <input id="endereco-numero" type="number" value={numero} onChange={(e) => setNumero(e.target.value === '' ? '' : Number(e.target.value))} min="1" required />
            </div>
            <div className="form-group half-width">
              <label htmlFor="endereco-uf">UF:</label>
              <input id="endereco-uf" value={uf} onChange={(e) => setUf(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 2))} pattern="[A-Za-z]{2}" maxLength={2} title="Informe a UF com duas letras." required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="endereco-bairro">Bairro:</label>
              <input id="endereco-bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} maxLength={20} required />
            </div>
            <div className="form-group half-width">
              <label htmlFor="endereco-cidade">Cidade:</label>
              <input id="endereco-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={20} required />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-save">Salvar Endereço</button>
          </div>
        </form>
      </div>
    </div>
  );
}
