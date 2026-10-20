import React, { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import type { Evento, Endereco } from '../../types';

interface SidebarProps {
  eventos: Evento[];
  eventoSelecionado: Evento | null;
  onSelectEvento: (id: number) => void;
  onSaveEvento: (evento: Evento) => void;
  onDeleteEvento: (id: number) => void;
  onNewEvento: () => void;
}

export default function Sidebar({
  eventos,
  eventoSelecionado,
  onSelectEvento,
  onSaveEvento,
  onDeleteEvento,
  onNewEvento,
}: SidebarProps) {
  // Inicialização direta do estado através das propriedades (props)
  const [nome, setNome] = useState(eventoSelecionado?.nome || '');
  const [rua, setRua] = useState(eventoSelecionado?.idEndereco?.rua || '');
  const [numero, setNumero] = useState<number | ''>(eventoSelecionado?.idEndereco?.numero ?? '');
  const [bairro, setBairro] = useState(eventoSelecionado?.idEndereco?.bairro || '');
  const [cidade, setCidade] = useState(eventoSelecionado?.idEndereco?.cidade || '');
  const [uf, setUf] = useState(eventoSelecionado?.idEndereco?.uf || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const endereco: Endereco = {
      id: eventoSelecionado?.idEndereco?.id,
      rua,
      numero: Number(numero),
      bairro,
      cidade,
      uf,
    };

    const eventoPayload: Evento = {
      id: eventoSelecionado?.id,
      nome,
      idEndereco: endereco,
    };

    onSaveEvento(eventoPayload);
  };

  return (
    <aside className="sidebar">
      <h1>Loxecutivo</h1>
      <h2>{!eventoSelecionado?.id ? 'Novo evento' : 'Editar Evento'}</h2>

      <form className="evento-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nome">Nome do Evento:</label>
          <input
            type="text"
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Show de Rock"
            maxLength={40}
            required
          />
        </div>

        <h3 className="section-title">Local do evento</h3>
        
        <div className="form-group">
          <label htmlFor="rua">Logradouro:</label>
          <input
            type="text"
            id="rua"
            value={rua}
            onChange={(e) => setRua(e.target.value)}
            placeholder="Nome da rua"
            maxLength={50}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="numero">Número:</label>
            <input
              type="number"
              id="numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value === '' ? '' : Number(e.target.value))}
              required
              min={0}
            />
          </div>

          <div className="form-group half-width">
            <label htmlFor="uf">UF:</label>
            <select
              id="uf"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="form-control"
              required
            >
              <option value="">Selecione...</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="bairro">Bairro:</label>
          <input
            type="text"
            id="bairro"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            required
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cidade">Cidade:</label>
          <input
            type="text"
            id="cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            required
            maxLength={20}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-save">Salvar</button>
        </div>
      </form>

      <hr className="divider" />

      <div className="evento-selector">
        <label htmlFor="listaEventos">Navegar pelos Eventos:</label>
        <select
          id="listaEventos"
          value={eventoSelecionado?.id || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              onNewEvento();
            } else {
              onSelectEvento(Number(val));
            }
          }}
        >
          <option value="">Criar Novo Evento</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nome}
            </option>
          ))}
        </select>
      </div>

      <hr className="divider" />

      {eventoSelecionado?.id && (
        <div className="evento-actions">
          <button type="button" className="btn btn-save btn-new" onClick={onNewEvento}>
            Criar novo evento
          </button>
          <button
            type="button"
            className="btn btn-danger btn-new"
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja excluir o evento "${eventoSelecionado.nome}"?`)) {
                onDeleteEvento(eventoSelecionado.id!);
              }
            }}
          >
            <FiTrash2 aria-hidden="true" /> Excluir evento
          </button>
        </div>
      )}
    </aside>
  );
}
