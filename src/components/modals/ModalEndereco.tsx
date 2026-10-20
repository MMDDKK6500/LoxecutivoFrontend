import React, { useState } from 'react';
import type { Endereco } from '../../types';

interface ModalEnderecoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (endereco: Endereco) => void;
  enderecoEdit?: Endereco | null;
}

export default function ModalEndereco({ isOpen, onClose, onSave, enderecoEdit }: ModalEnderecoProps) {
  const [rua, setRua] = useState(enderecoEdit?.rua ?? '');
  const [numero, setNumero] = useState<number | ''>(enderecoEdit?.numero ?? '');
  const [bairro, setBairro] = useState(enderecoEdit?.bairro ?? '');
  const [cidade, setCidade] = useState(enderecoEdit?.cidade ?? '');
  const [uf, setUf] = useState(enderecoEdit?.uf ?? '');

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (numero === '') return;
    onSave({ id: enderecoEdit?.id, rua, numero: Number(numero), bairro, cidade, uf: uf.toUpperCase() });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>{enderecoEdit ? 'Editar Endereço' : 'Novo Endereço'}</h2>
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
              <select id="endereco-uf" value={uf} onChange={(e) => setUf(e.target.value)} className="form-control" required>
                <option value="">Selecione...</option>
                <option value="AC">Acre</option><option value="AL">Alagoas</option><option value="AP">Amapá</option>
                <option value="AM">Amazonas</option><option value="BA">Bahia</option><option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option><option value="ES">Espírito Santo</option><option value="GO">Goiás</option>
                <option value="MA">Maranhão</option><option value="MT">Mato Grosso</option><option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option><option value="PA">Pará</option><option value="PB">Paraíba</option>
                <option value="PR">Paraná</option><option value="PE">Pernambuco</option><option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option><option value="RN">Rio Grande do Norte</option><option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option><option value="RR">Roraima</option><option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option><option value="SE">Sergipe</option><option value="TO">Tocantins</option>
              </select>
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
            <button type="submit" className="btn btn-save">{enderecoEdit ? 'Salvar Alterações' : 'Salvar Endereço'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
