import React, { useState, useEffect } from 'react';
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
  const [viagemEmEdicao, setViagemEmEdicao] = useState<Viagens | null>(null);
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
    }
    // O bloco 'else' foi removido para evitar avisos de renders em cascata (set-state-in-effect)
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
    } catch {
      alert("Erro ao guardar o evento. Verifique os dados.");
    }
  };

  const handleSaveViagem = async (viagemPayload: Viagens) => {
    try {
      if (viagemPayload.id) {
        await apiCore.put(`/viagens/${viagemPayload.id}`, viagemPayload);
      } else {
        await apiCore.post('/viagens', viagemPayload);
      }
      setIsViagemModalOpen(false);
      setViagemEmEdicao(null);
      if (eventoSelecionado) selecionarEvento(eventoSelecionado.id!); // Recarrega lista
    } catch {
      alert("Erro ao salvar viagem.");
    }
  };

  const handleSavePassageiro = async (passageiroPayload: Passageiro) => {
    try {
      await apiCore.post('/passageiros', passageiroPayload);
      setIsPassageiroModalOpen(false);
      // Força a atualização da viagem selecionada para recarregar passageiros
      setViagemSelecionada({ ...viagemSelecionada } as Viagens);
    } catch {
      alert("Erro ao salvar passageiro.");
    }
  };

  const handleSaveVeiculo = async (veiculoPayload: Veiculo) => {
    try {
      await apiCore.post('/veiculos', veiculoPayload);
      setIsVeiculoModalOpen(false);
      carregarRecursosGlobais(); // Atualiza dropdowns
    } catch {
      alert("Erro ao salvar veículo.");
    }
  };

  const handleSaveMotorista = async (motoristaPayload: Motorista) => {
    try {
      await apiCore.post('/motoristas', motoristaPayload);
      setIsMotoristaModalOpen(false);
      carregarRecursosGlobais(); // Atualiza dropdowns
    } catch {
      alert("Erro ao salvar motorista.");
    }
  };

  const handleDeleteEvento = async (id: number) => {
    try {
      await apiCore.delete(`/eventos/${id}`);
      carregarEventos();
      handleNewEvento();
    } catch {
      alert("Erro ao excluir o evento.");
    }
  };

  const handleNewEvento = () => {
    setEventoSelecionado(null);
    setViagensDoEvento([]);
    setViagemSelecionada(null);
    setPassageirosDaViagem([]);
  };

  const handleDeleteViagem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Evita que a viagem seja selecionada ao clicar no botão de excluir
    
    if (!window.confirm('Tem a certeza que deseja excluir esta viagem e os seus passageiros?')) {
      return;
    }

    try {
      // Nota: Use a rota correspondente ao seu Java. 
      // Se converteu para REST, será .delete(`/viagens/${id}`). 
      // Se manteve o padrão antigo do Controller Thymeleaf, será .get(`/viagens/deletar/${id}`)
      await apiCore.get(`/viagens/deletar/${id}`); 
      
      // Recarrega a lista de viagens do evento atual
      if (eventoSelecionado) {
        selecionarEvento(eventoSelecionado.id!);
      }
      
      // Se a viagem excluída era a que estava aberta, limpa a seleção e os passageiros
      if (viagemSelecionada?.id === id) {
        setViagemSelecionada(null);
        setPassageirosDaViagem([]);
      }
    } catch {
      alert("Erro ao excluir a viagem.");
    }
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
          <div className="dashboard-grid">
            
            {/* Card 1: Viagens do Evento */}
            <div className="card">
              <div className="card-header">
                <h3>Viagens do Evento</h3>
                {eventoSelecionado && (
                  <button className="btn-sm btn-add" onClick={() => { setViagemEmEdicao(null); setIsViagemModalOpen(true); }}>+ Adicionar</button>
                )}
              </div>
              
              {!eventoSelecionado ? (
                <div className="placeholder"><p>Selecione um evento salvo.</p></div>
              ) : viagensDoEvento.length === 0 ? (
                <div className="placeholder"><p>Nenhuma viagem cadastrada.</p></div>
              ) : (
                <ul className="item-list">
                  {viagensDoEvento.map((viagem) => (
                    <li 
                      key={viagem.id} 
                      onClick={() => setViagemSelecionada(viagem)}
                      className={viagemSelecionada?.id === viagem.id ? 'active' : ''}
                      style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span className="item-link">
                        Veículo: <strong>{viagem.idVeiculo}</strong>
                      </span>
                      
                      <div className="item-actions">
                        <button
                          onClick={(e) => handleDeleteViagem(e, viagem.id!)}
                          className="btn-danger-outline"
                          style={{ padding: '2px 8px', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                          title="Excluir Viagem"
                        >
                          Excluir
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Card 2: Passageiros */}
            <div className="card">
              <div className="card-header">
                <h3>Passageiros</h3>
                {viagemSelecionada && (
                  <button className="btn-sm btn-add" onClick={() => setIsPassageiroModalOpen(true)}>+ Adicionar</button>
                )}
              </div>
              
              {!viagemSelecionada ? (
                <div className="placeholder"><p>Selecione uma viagem ao lado.</p></div>
              ) : passageirosDaViagem.length === 0 ? (
                <div className="placeholder"><p>Sem passageiros escalados.</p></div>
              ) : (
                <ul className="item-list">
                  {passageirosDaViagem.map((passageiro) => (
                    <li key={passageiro.id}>
                      <strong>{passageiro.nome} {passageiro.sobrenome}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Card 3: Transporte e Rota */}
            <div className="card">
              <div className="card-header">
                <h3>Transporte e Rota</h3>
                {viagemSelecionada && (
                  <button
                    className="btn-sm btn-add"
                    onClick={() => {
                      setViagemEmEdicao(viagemSelecionada);
                      setIsViagemModalOpen(true);
                    }}
                  >
                    Editar
                  </button>
                )}
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

              {/* Botões sempre na base do cartão, empurrados para o fundo via marginTop: 'auto' */}
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f0f2f5' }}>
                <button 
                  className="btn-sm btn-add" 
                  style={{ flex: 1, padding: '8px' }} 
                  onClick={() => setIsMotoristaModalOpen(true)}
                >
                  + Motorista
                </button>
                <button 
                  className="btn-sm btn-add" 
                  style={{ flex: 1, padding: '8px' }} 
                  onClick={() => setIsVeiculoModalOpen(true)}
                >
                  + Veículo
                </button>
              </div>

            </div>
          </div>
        </section>
      </div>

      {/* Renderização Condicional dos Modais */}
      {eventoSelecionado && (
        <ModalViagem 
          isOpen={isViagemModalOpen} 
          onClose={() => { setIsViagemModalOpen(false); setViagemEmEdicao(null); }}
          onSave={handleSaveViagem} 
          eventoAtual={eventoSelecionado}
          enderecos={enderecos}
          motoristas={motoristas}
          veiculos={veiculos}
          viagemEdit={viagemEmEdicao}
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
