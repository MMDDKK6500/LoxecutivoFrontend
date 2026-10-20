import React, { useState } from 'react';
import type { Viagens, Evento, Endereco, Motorista, Veiculo } from '../../types';

interface ModalViagemProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (viagem: Viagens) => void;
  eventoAtual: Evento;
  enderecos: Endereco[];
  motoristas: Motorista[];
  veiculos: Veiculo[];
  viagemEdit?: Viagens | null;
}

export default function ModalViagem({ isOpen, onClose, onSave, eventoAtual, enderecos, motoristas, veiculos, viagemEdit }: ModalViagemProps) {
  const [idOrigem, setIdOrigem] = useState<number | ''>(viagemEdit?.localDeOrigem?.id ?? '');
  const [idDestino, setIdDestino] = useState<number | ''>(viagemEdit?.localDeDestino?.id ?? '');
  const [idMotorista, setIdMotorista] = useState<number | ''>(viagemEdit?.idMotorista?.id ?? '');
  const [idVeiculo, setIdVeiculo] = useState(viagemEdit?.idVeiculo ?? '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Procura os objetos completos com base no ID selecionado
    const localDeOrigem = enderecos.find(end => end.id === idOrigem);
    const localDeDestino = enderecos.find(end => end.id === idDestino);
    const motorista = motoristas.find(mot => mot.id === idMotorista);

    if (localDeOrigem && localDeDestino && motorista && idVeiculo) {
      onSave({
        id: viagemEdit?.id,
        localDeOrigem,
        localDeDestino,
        idMotorista: motorista,
        idVeiculo,
        idEvento: eventoAtual
      });
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>{viagemEdit ? 'Editar Transporte e Rota' : 'Nova Rota / Viagem'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          
          <h3 className="section-title">Itinerário</h3>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Local de Origem:</label>
              <select value={idOrigem} onChange={(e) => setIdOrigem(Number(e.target.value))} required>
                <option value="">Selecione a origem...</option>
                {enderecos.map(end => (
                  <option key={end.id} value={end.id}>{end.rua}, {end.numero} - {end.cidade}</option>
                ))}
              </select>
            </div>
            <div className="form-group half-width">
              <label>Local de Destino:</label>
              <select value={idDestino} onChange={(e) => setIdDestino(Number(e.target.value))} required>
                <option value="">Selecione o destino...</option>
                {enderecos.map(end => (
                  <option key={end.id} value={end.id}>{end.rua}, {end.numero} - {end.cidade}</option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="section-title" style={{ marginTop: '15px' }}>Logística</h3>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Atribuir Motorista:</label>
              <select value={idMotorista} onChange={(e) => setIdMotorista(Number(e.target.value))} required>
                <option value="">Selecione o motorista...</option>
                {motoristas.map(mot => (
                  <option key={mot.id} value={mot.id}>{mot.nome} {mot.sobrenome}</option>
                ))}
              </select>
            </div>
            <div className="form-group half-width">
              <label>Veículo (Placa):</label>
              <select value={idVeiculo} onChange={(e) => setIdVeiculo(e.target.value)} required>
                <option value="">Selecione o veículo...</option>
                {veiculos.map(veic => (
                  <option key={veic.idPlaca} value={veic.idPlaca}>{veic.modelo} ({veic.idPlaca})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '30px' }}>
            <button type="button" className="btn btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-save">{viagemEdit ? 'Salvar Alterações' : 'Salvar Viagem'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
