import { useState, useEffect } from 'react';
import { apiCore } from '../services/apiCore';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import type { Evento, Viagens, Passageiro } from '../types';

export default function Dashboard() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);
  const [viagensDoEvento, setViagensDoEvento] = useState<Viagens[]>([]);
  const [viagemSelecionada, setViagemSelecionada] = useState<Viagens | null>(null);
  const [passageirosDaViagem, setPassageirosDaViagem] = useState<Passageiro[]>([]);
  
  // Estado para a barra de pesquisa da Navbar
  const [termoPesquisa, setTermoPesquisa] = useState('');

  const carregarEventos = () => {
    apiCore.get<Evento[]>('/eventos')
      .then(response => setEventos(response.data))
      .catch(error => console.error("Erro ao carregar eventos:", error));
  };

   useEffect(() => {
    carregarEventos();
  }, []);

  const selecionarEvento = (eventoId: number) => {
    const eventoEncontrado = eventos.find(ev => ev.id === eventoId) || null;
    setEventoSelecionado(eventoEncontrado);
    setViagemSelecionada(null);
    setPassageirosDaViagem([]);

    apiCore.get<Viagens[]>(`/viagens/evento/${eventoId}`)
      .then(response => setViagensDoEvento(response.data))
      .catch(error => {
        console.error("Erro ao carregar viagens do evento:", error);
        setViagensDoEvento([]);
      });
  };

  const handleSaveEvento = async (eventoPayload: Evento) => {
    try {
      if (eventoPayload.id) {
        await apiCore.put(`/eventos/${eventoPayload.id}`, eventoPayload);
      } else {
        await apiCore.post('/eventos', eventoPayload);
      }
      carregarEventos();
      handleNewEvento();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      alert("Erro ao guardar o evento. Verifique os dados.");
    }
  };

  const handleDeleteEvento = async (id: number) => {
    try {
      await apiCore.delete(`/eventos/${id}`);
      carregarEventos();
      handleNewEvento();
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      alert("Erro ao excluir o evento.");
    }
  };

  const handleNewEvento = () => {
    setEventoSelecionado(null);
    setViagensDoEvento([]);
    setViagemSelecionada(null);
    setPassageirosDaViagem([]);
  };

  // Filtra os eventos com base no que é digitado na Navbar
  const eventosFiltrados = eventos.filter(ev => 
    ev.nome.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar 
        key={eventoSelecionado?.id || 'novo'}
        eventos={eventosFiltrados} 
        eventoSelecionado={eventoSelecionado} 
        onSelectEvento={selecionarEvento} 
        onSaveEvento={handleSaveEvento}
        onDeleteEvento={handleDeleteEvento}
        onNewEvento={handleNewEvento}
      />

      <div className="main">
        <Navbar 
          searchTerm={termoPesquisa}
          onSearchChange={setTermoPesquisa}
          onLogout={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
        />
        
        <section className="content">
          <div className="dashboard-grid">
            
            {/* Card 1: Viagens do Evento */}
            <div className="card">
              <div className="card-header">
                <h3>Viagens do Evento</h3>
              </div>
              <ul className="item-list">
                {!eventoSelecionado ? (
                  <li className="empty-msg">Selecione um evento salvo.</li>
                ) : viagensDoEvento.length === 0 ? (
                  <li className="empty-msg">Nenhuma viagem cadastrada.</li>
                ) : (
                  viagensDoEvento.map((viagem) => (
                    <li 
                      key={viagem.id} 
                      onClick={() => setViagemSelecionada(viagem)}
                      className={viagemSelecionada?.id === viagem.id ? 'active' : ''}
                    >
                      <span className="item-link">
                        Veículo: <strong>{viagem.idVeiculo}</strong>
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Card 2: Passageiros */}
            <div className="card">
              <div className="card-header">
                <h3>Passageiros</h3>
              </div>
              {!viagemSelecionada ? (
                <div className="placeholder"><p>Selecione uma viagem ao lado</p></div>
              ) : (
                <ul className="item-list">
                  {passageirosDaViagem.length === 0 ? (
                    <li className="empty-msg">Sem passageiros escalados.</li>
                  ) : (
                    passageirosDaViagem.map((passageiro) => (
                      <li key={passageiro.id}>
                        <strong>{passageiro.nome} {passageiro.sobrenome}</strong>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {/* Card 3: Transporte e Rota */}
            <div className="card">
              <div className="card-header">
                <h3>Transporte e Rota</h3>
              </div>
              {!viagemSelecionada ? (
                <div className="placeholder"><p>Selecione uma viagem para ver os detalhes.</p></div>
              ) : (
                <div className="details-container">
                  <div className="detail-section">
                    <h4 className="sub-title">Itinerário</h4>
                    <p><strong>Origem:</strong> {viagemSelecionada.localDeOrigem?.rua}, {viagemSelecionada.localDeOrigem?.numero}</p>
                    <p><strong>Destino:</strong> {viagemSelecionada.localDeDestino?.rua}, {viagemSelecionada.localDeDestino?.numero}</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}