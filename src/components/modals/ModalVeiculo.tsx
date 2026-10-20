import React, { useState, useEffect } from 'react';
import type { Veiculo } from '../../types';

interface ModalVeiculoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (veiculo: Veiculo) => void;
  veiculoEdit?: Veiculo | null;
}

export default function ModalVeiculo({ isOpen, onClose, onSave, veiculoEdit }: ModalVeiculoProps) {
  const [idPlaca, setIdPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState<number | ''>('');
  const [marca, setMarca] = useState('');
  const [cor, setCor] = useState('');

  useEffect(() => {
    if (veiculoEdit) {
      setIdPlaca(veiculoEdit.idPlaca);
      setModelo(veiculoEdit.modelo);
      setAno(veiculoEdit.ano);
      setMarca(veiculoEdit.marca);
      setCor(veiculoEdit.cor);
    } else {
      setIdPlaca(''); setModelo(''); setAno(''); setMarca(''); setCor('');
    }
  }, [veiculoEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ idPlaca: idPlaca.toUpperCase(), modelo, ano: Number(ano), marca, cor });
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{veiculoEdit ? 'Editar Veículo' : 'Novo Veículo'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Placa:</label>
              <input 
                type="text" 
                value={idPlaca} 
                onChange={(e) => setIdPlaca(e.target.value.toUpperCase())} 
                maxLength={7} 
                placeholder="ABC1D23" 
                required 
                disabled={!!veiculoEdit} // A placa é o ID no Java, não deve mudar na edição
              />
            </div>
            <div className="form-group half-width">
              <label>Ano:</label>
              <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} min="1950" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Marca:</label>
              <input type="text" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex: Mercedes" required />
            </div>
            <div className="form-group half-width">
              <label>Modelo:</label>
              <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex: Sprinter" required />
            </div>
          </div>
          <div className="form-group">
            <label>Cor:</label>
            <input type="text" value={cor} onChange={(e) => setCor(e.target.value)} placeholder="Ex: Prata" required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-save">Salvar Veículo</button>
          </div>
        </form>
      </div>
    </div>
  );
}