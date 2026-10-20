import { useState, useEffect } from 'react';
import { apiCore } from '../services/apiCore';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import type { Evento, Viagens, Passageiro, Endereco, Motorista, Veiculo } from '../types';

// Importação dos Modais
import ModalViagem from '../components/modals/ModalViagem';
import ModalPassageiro from '../components/modals/ModalPassageiro';
import ModalVeiculo from '../components/modals/ModalVeiculo';
import ModalMotorista from '../components/modals/ModalMotorista';

export default function Dashboard() {
  // Estados principais
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);
  
  const [viagensDoEvento, setViagensDoEvento] = useState<Viagens[]>([]);
  const [viagemSelecionada, setViagemSelecionada] = useState<Viagens | null>(null);
  const [passageirosDaViagem, setPassageirosDaViagem] = useState<Passageiro[]>([]);
  
  const [termoPesquisa, setTermoPesquisa] = useState('');

  // Estados dos Modais (Visibilidade)
  const [isViagemModalOpen, setIsViagemModalOpen] = useState(false);
  const [isPassageiroModalOpen, setIsPassageiroModalOpen] = useState(false);
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [isMotoristaModalOpen, setIsMotoristaModalOpen] = useState(false);

  // Estados de Dados Auxiliares (Para os selects do Modal de Viagem)
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  // Carregamentos de Dados da API
  const carregarEventos = () => {
    apiCore.get<Evento[]>('/eventos')
      .then(response => setEventos(response.data))
      .catch(error => console.error("Erro ao carregar eventos:", error));
  };

  const carregarRecursosGlobais = () => {
    apiCore.get<Endereco[]>('/enderecos').then(res => setEnderecos(res.data)).catch(() => {});
    apiCore.get<Motorista[]>('/motoristas').then(res => setMotoristas(res.data)).catch(() => {});
    apiCore.get<Veiculo[]>('/veiculos').then(res => setVeiculos(res.data)).catch(() => {});
  };

  useEffect(() => {
    carregarEventos();
    carregarRecursosGlobais();
  }, []);

  // Quando seleciona uma viagem, tenta buscar os passageiros dela
  useEffect(() => {
    if (viagemSelecionada?.id) {
      apiCore.get<Passageiro[]>(`/passageiros/viagem/${viagemSelecionada.id}`)
        .then(res => setPassageirosDaViagem(res.data))
        .catch(() => setPassageirosDaViagem([])); // Fallback em caso de erro
    } else {
      setPassageirosDaViagem([]);
    }
  }, [viagemSelecionada]);

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

  // Funções de Gravação (Salvar Dados dos Modais)
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
      alert("Erro ao guardar o evento. Verifique os dados.");
    }
  };

  const handleSaveViagem = async (viagemPayload: Viagens) => {
    try {
      await apiCore.post('/viagens', viagemPayload);
      setIsViagemModalOpen(false);
      if (eventoSelecionado) selecionarEvento(eventoSelecionado.id!); // Recarrega lista
    } catch (error) {
      alert("Erro ao salvar viagem.");
    }
  };

  const handleSavePassageiro = async (passageiroPayload: Passageiro) => {
    try {
      await apiCore.post('/passageiros', passageiroPayload);
      setIsPassageiroModalOpen(false);
      // Força a atualização da viagem selecionada para recarregar passageiros
      setViagemSelecionada({ ...viagemSelecionada } as Viagens);
    } catch (error) {
      alert("Erro ao salvar passageiro.");
    }
  };

  const handleSaveVeiculo = async (veiculoPayload: Veiculo) => {
    try {
      await apiCore.post('/veiculos', veiculoPayload);
      setIsVeiculoModalOpen(false);
      carregarRecursosGlobais(); // Atualiza dropdowns
    } catch (error) {
      alert("Erro ao salvar veículo.");
    }
  };

  const handleSaveMotorista = async (motoristaPayload: Motorista) => {
    try {
      await apiCore.post('/motoristas', motoristaPayload);
      setIsMotoristaModalOpen(false);
      carregarRecursosGlobais(); // Atualiza dropdowns
    } catch (error) {
      alert("Erro ao salvar motorista.");
    }
  };

  const handleDeleteEvento = async (id: number) => {
    try {
      await apiCore.delete(`/eventos/${id}`);
      carregarEventos();
      handleNewEvento();
    } catch (error) {
      alert("Erro ao excluir o evento.");
    }
  };

  const handleNewEvento = () => {
    setEventoSelecionado(null);
    setViagensDoEvento([]);
    setViagemSelecionada(null);
    setPassageirosDaViagem([]);
  };

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
          {/* Barra de Ferramentas Globais */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '15px' }}>
            <button className="btn-sm btn-edit" onClick={() => setIsMotoristaModalOpen(true)}>+ Novo Motorista</button>
            <button className="btn-sm btn-edit" onClick={() => setIsVeiculoModalOpen(true)}>+ Novo Veículo</button>
          </div>

          <div className="dashboard-grid">
            
            {/* Card 1: Viagens do Evento */}
            <div className="card">
              <div className="card-header">
                <h3>Viagens do Evento</h3>
                {/* Botão de adicionar Viagem só aparece se um evento estiver selecionado */}
                {eventoSelecionado && (
                  <button className="btn-sm btn-add" onClick={() => setIsViagemModalOpen(true)}>+ Adicionar</button>
                )}
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
                      style={{ cursor: 'pointer' }}
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
                {/* Botão de adicionar Passageiro só aparece se uma viagem estiver selecionada */}
                {viagemSelecionada && (
                  <button className="btn-sm btn-add" onClick={() => setIsPassageiroModalOpen(true)}>+ Adicionar</button>
                )}
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

      {/* Renderização Condicional dos Modais */}
      {eventoSelecionado && (
        <ModalViagem 
          isOpen={isViagemModalOpen} 
          onClose={() => setIsViagemModalOpen(false)} 
          onSave={handleSaveViagem} 
          eventoAtual={eventoSelecionado}
          enderecos={enderecos}
          motoristas={motoristas}
          veiculos={veiculos}
        />
      )}

      {viagemSelecionada && (
        <ModalPassageiro 
          isOpen={isPassageiroModalOpen} 
          onClose={() => setIsPassageiroModalOpen(false)} 
          onSave={handleSavePassageiro}
          viagemAtual={viagemSelecionada}
        />
      )}

      <ModalVeiculo 
        isOpen={isVeiculoModalOpen} 
        onClose={() => setIsVeiculoModalOpen(false)} 
        onSave={handleSaveVeiculo} 
      />

      <ModalMotorista 
        isOpen={isMotoristaModalOpen} 
        onClose={() => setIsMotoristaModalOpen(false)} 
        onSave={handleSaveMotorista} 
      />

    </div>
  );
}