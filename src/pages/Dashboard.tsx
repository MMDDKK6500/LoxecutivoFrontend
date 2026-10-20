import React, { useState, useEffect, useRef } from 'react';
import { apiCore } from '../services/apiCore';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import type { Evento, Viagens, Passageiro, Endereco, Motorista, Veiculo } from '../types';

// Importação dos Modais
import ModalViagem from '../components/modals/ModalViagem';
import ModalPassageiro from '../components/modals/ModalPassageiro';
import ModalVeiculo from '../components/modals/ModalVeiculo';
import ModalMotorista from '../components/modals/ModalMotorista';
import { FiEdit2, FiPlus, FiTrash2, FiUserPlus, FiTruck } from 'react-icons/fi';

export default function Dashboard() {
  // Estados principais
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);
  
  const [viagensDoEvento, setViagensDoEvento] = useState<Viagens[]>([]);
  const [viagemSelecionada, setViagemSelecionada] = useState<Viagens | null>(null);
  const [viagemEmEdicao, setViagemEmEdicao] = useState<Viagens | null>(null);
  const [passageirosDaViagem, setPassageirosDaViagem] = useState<Passageiro[]>([]);
  const [passageirosReload, setPassageirosReload] = useState(0);
  
  const [termoPesquisa, setTermoPesquisa] = useState('');

  // Estados dos Modais (Visibilidade)
  const [isViagemModalOpen, setIsViagemModalOpen] = useState(false);
  const [isPassageiroModalOpen, setIsPassageiroModalOpen] = useState(false);
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [isMotoristaModalOpen, setIsMotoristaModalOpen] = useState(false);
  const [passageiroEmEdicao, setPassageiroEmEdicao] = useState<Passageiro | null>(null);

  // Estados de Dados Auxiliares (Para os selects do Modal de Viagem)
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const viagensRequestId = useRef(0);

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

  const carregarViagensDoEvento = async (eventoId: number) => {
    const requestId = ++viagensRequestId.current;
    try {
      const response = await apiCore.get<Viagens[]>(`/viagens/evento/${eventoId}`);
      const isCurrent = requestId === viagensRequestId.current;
      if (isCurrent) {
        setViagensDoEvento(response.data);
      }
      return { viagens: response.data, isCurrent };
    } catch (error) {
      const isCurrent = requestId === viagensRequestId.current;
      if (isCurrent) {
        console.error('Erro ao carregar viagens do evento:', error);
        setViagensDoEvento([]);
      }
      return { viagens: [], isCurrent };
    }
  };

  useEffect(() => {
    carregarEventos();
    carregarRecursosGlobais();
  }, []);

  // Quando seleciona uma viagem, tenta buscar os passageiros dela
  useEffect(() => {
    const viagemId = viagemSelecionada?.id;
    if (!viagemId) return;

    let isCurrent = true;
    apiCore.get<Passageiro[]>(`/passageiros/viagem/${viagemId}`)
      .then(res => { if (isCurrent) setPassageirosDaViagem(res.data); })
      .catch(() => { if (isCurrent) setPassageirosDaViagem([]); });

    return () => { isCurrent = false; };
  }, [viagemSelecionada?.id, passageirosReload]);

  const selecionarEvento = (eventoId: number) => {
    const eventoEncontrado = eventos.find(ev => ev.id === eventoId) || null;
    setEventoSelecionado(eventoEncontrado);
    setViagemSelecionada(null);
    setPassageirosDaViagem([]);
    
    void carregarViagensDoEvento(eventoId);
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
      if (eventoSelecionado) {
        const result = await carregarViagensDoEvento(eventoSelecionado.id!);
        const viagemAtualizada = result.viagens.find(item => item.id === viagemPayload.id);
        if (result.isCurrent && viagemAtualizada) setViagemSelecionada(viagemAtualizada);
      }
    } catch {
      alert("Erro ao salvar viagem.");
    }
  };

  const handleSavePassageiro = async (passageiroPayload: Passageiro) => {
    try {
      if (passageiroPayload.id) {
        await apiCore.put(`/passageiros/${passageiroPayload.id}`, passageiroPayload);
      } else {
        await apiCore.post('/passageiros', passageiroPayload);
      }
      setIsPassageiroModalOpen(false);
      setPassageiroEmEdicao(null);
      setPassageirosReload((current) => current + 1);
    } catch {
      alert("Erro ao salvar passageiro.");
    }
  };

  const handleDeletePassageiro = async (id: number) => {
    if (!window.confirm('Excluir este passageiro da viagem?')) return;
    try {
      await apiCore.delete(`/passageiros/${id}`);
      setPassageirosReload((current) => current + 1);
    } catch {
      alert('Erro ao excluir passageiro.');
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
    viagensRequestId.current += 1;
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
      await apiCore.delete(`/viagens/${id}`);
      
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

  const motoristaDaViagem = viagemSelecionada
    ? motoristas.find(motorista => motorista.id === viagemSelecionada.idMotorista?.id) ?? viagemSelecionada.idMotorista
    : null;
  const veiculoDaViagem = viagemSelecionada
    ? veiculos.find(veiculo => veiculo.idPlaca === viagemSelecionada.idVeiculo)
    : null;

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
                  <button className="icon-btn btn-add" aria-label="Adicionar viagem" title="Adicionar viagem" onClick={() => { setViagemEmEdicao(null); setIsViagemModalOpen(true); }}><FiPlus /></button>
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
                      onClick={() => {
                        setPassageirosDaViagem([]);
                        setViagemSelecionada(viagem);
                      }}
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
                          <FiTrash2 />
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
                  <button className="icon-btn btn-add" aria-label="Adicionar passageiro" title="Adicionar passageiro" onClick={() => { setPassageiroEmEdicao(null); setIsPassageiroModalOpen(true); }}><FiUserPlus /></button>
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
                      <div className="item-actions">
                        <button className="icon-btn btn-edit" aria-label={`Editar ${passageiro.nome}`} title="Editar passageiro" onClick={() => { setPassageiroEmEdicao(passageiro); setIsPassageiroModalOpen(true); }}><FiEdit2 /></button>
                        <button className="icon-btn btn-danger-outline" aria-label={`Excluir ${passageiro.nome}`} title="Excluir passageiro" onClick={() => passageiro.id && handleDeletePassageiro(passageiro.id)}><FiTrash2 /></button>
                      </div>
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
                    <FiEdit2 />
                  </button>
                )}
              </div>
              
              {!viagemSelecionada ? (
                <div className="placeholder"><p>Selecione uma viagem para ver os detalhes.</p></div>
              ) : (
                <div className="details-container">
                  <div className="detail-section">
                    <h4 className="sub-title">Itinerário</h4>
                    <p><strong>Origem:</strong> {viagemSelecionada.localDeOrigem?.rua}, {viagemSelecionada.localDeOrigem?.numero} — {viagemSelecionada.localDeOrigem?.bairro}, {viagemSelecionada.localDeOrigem?.cidade}/{viagemSelecionada.localDeOrigem?.uf}</p>
                    <p><strong>Destino:</strong> {viagemSelecionada.localDeDestino?.rua}, {viagemSelecionada.localDeDestino?.numero} — {viagemSelecionada.localDeDestino?.bairro}, {viagemSelecionada.localDeDestino?.cidade}/{viagemSelecionada.localDeDestino?.uf}</p>
                  </div>
                  <div className="detail-section">
                    <h4 className="sub-title">Logística</h4>
                    <div className="logistics-grid">
                      <div className="logistics-item">
                        <span className="logistics-label">Motorista</span>
                        <strong>{motoristaDaViagem ? `${motoristaDaViagem.nome} ${motoristaDaViagem.sobrenome}` : 'Não informado'}</strong>
                      </div>
                      <div className="logistics-item">
                        <span className="logistics-label">CPF</span>
                        <span>{motoristaDaViagem?.cpf || 'Não informado'}</span>
                      </div>
                      <div className="logistics-item">
                        <span className="logistics-label">RG</span>
                        <span>{motoristaDaViagem?.rg || 'Não informado'}</span>
                      </div>
                      <div className="logistics-item">
                        <span className="logistics-label">Veículo</span>
                        <strong>{veiculoDaViagem ? `${veiculoDaViagem.marca} ${veiculoDaViagem.modelo}` : 'Detalhes indisponíveis'}</strong>
                      </div>
                      <div className="logistics-item">
                        <span className="logistics-label">Placa</span>
                        <span>{viagemSelecionada.idVeiculo || 'Não informado'}</span>
                      </div>
                      <div className="logistics-item">
                        <span className="logistics-label">Ano e cor</span>
                        <span>{veiculoDaViagem ? `${veiculoDaViagem.ano} · ${veiculoDaViagem.cor}` : 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                  {viagemSelecionada.idEvento?.nome && (
                    <div className="detail-section">
                      <h4 className="sub-title">Evento</h4>
                      <p>{viagemSelecionada.idEvento.nome}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Botões sempre na base do cartão, empurrados para o fundo via marginTop: 'auto' */}
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #f0f2f5' }}>
                <button 
                  className="btn-sm btn-add" 
                  style={{ flex: 1, padding: '8px' }} 
                  onClick={() => setIsMotoristaModalOpen(true)}
                >
                  <FiUserPlus /> Motorista
                </button>
                <button 
                  className="btn-sm btn-add" 
                  style={{ flex: 1, padding: '8px' }} 
                  onClick={() => setIsVeiculoModalOpen(true)}
                >
                  <FiTruck /> Veículo
                </button>
              </div>

            </div>
          </div>
        </section>
      </div>

      {/* Renderização Condicional dos Modais */}
      {eventoSelecionado && isViagemModalOpen && (
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

      {viagemSelecionada && isPassageiroModalOpen && (
        <ModalPassageiro 
          isOpen={isPassageiroModalOpen} 
          onClose={() => setIsPassageiroModalOpen(false)} 
          onSave={handleSavePassageiro}
          viagemAtual={viagemSelecionada}
          passageiroEdit={passageiroEmEdicao}
        />
      )}

      {isVeiculoModalOpen && <ModalVeiculo 
        isOpen={isVeiculoModalOpen} 
        onClose={() => setIsVeiculoModalOpen(false)} 
        onSave={handleSaveVeiculo} 
      />}

      {isMotoristaModalOpen && <ModalMotorista 
        isOpen={isMotoristaModalOpen} 
        onClose={() => setIsMotoristaModalOpen(false)} 
        onSave={handleSaveMotorista} 
      />}

    </div>
  );
}
