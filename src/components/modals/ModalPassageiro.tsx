import React, { useState, useEffect } from 'react';
import type { Passageiro, Viagens } from '../../types';

interface ModalPassageiroProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (passageiro: Passageiro) => void;
  viagemAtual: Viagens;
  passageiroEdit?: Passageiro | null;
}

export default function ModalPassageiro({ isOpen, onClose, onSave, viagemAtual, passageiroEdit }: ModalPassageiroProps) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [numero, setNumero] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');

  useEffect(() => {
    if (passageiroEdit) {
      setNome(passageiroEdit.nome); setSobrenome(passageiroEdit.sobrenome);
      setNumero(passageiroEdit.numero); setEmpresa(passageiroEdit.empresa);
      setRg(passageiroEdit.rg); setCpf(passageiroEdit.cpf);
    } else {
      setNome(''); setSobrenome(''); setNumero(''); setEmpresa(''); setRg(''); setCpf('');
    }
  }, [passageiroEdit, isOpen]);

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
      <div className="modal-content">
        <div className="modal-header">
          <h2>{passageiroEdit ? 'Editar Passageiro' : 'Adicionar Passageiro'}</h2>
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
              <label>Contacto (Telemóvel):</label>
              <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} required />
            </div>
            <div className="form-group half-width">
              <label>Empresa:</label>
              <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label>RG:</label>
              <input type="text" maxLength={9} value={rg} onChange={(e) => setRg(e.target.value.replace(/\D/g, ''))} required />
            </div>
            <div className="form-group half-width">
              <label>CPF:</label>
              <input type="text" maxLength={11} value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))} required />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-save">Confirmar Passageiro</button>
          </div>
        </form>
      </div>
    </div>
  );
}