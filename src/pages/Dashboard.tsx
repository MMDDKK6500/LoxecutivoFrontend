import React, { useState, useEffect, useRef } from 'react';
import { apiCore } from '../services/apiCore';
import { apiExport } from '../services/apiExport';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import type { Evento, Viagens, Passageiro, Endereco, Motorista, Veiculo } from '../types';

// Importação dos Modais
import ModalViagem from '../components/modals/ModalViagem';
import ModalPassageiro from '../components/modals/ModalPassageiro';
import ModalVeiculo from '../components/modals/ModalVeiculo';
import ModalMotorista from '../components/modals/ModalMotorista';
import ModalEndereco from '../components/modals/ModalEndereco';
import { FiDownload, FiEdit2, FiFileText, FiPlus, FiTrash2, FiUserPlus, FiTruck, FiMapPin } from 'react-icons/fi';

export default function Dashboard() {
  const apiErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (typeof message === 'string' && message.length > 0) return message;
    }
    if (error instanceof Error && error.message.length > 0) return error.message;
    return fallback;
  };
  // Estados principais
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);
  
  const [viagensDoEvento, setViagensDoEvento] = useState<Viagens[]>([]);
  const [viagemSelecionada, setViagemSelecionada] = useState<Viagens | null>(null);
  const [viagemEmEdicao, setViagemEmEdicao] = useState<Viagens | null>(null);
  const [passageirosDaViagem, setPassageirosDaViagem] = useState<Passageiro[]>([]);
  const [passageirosReload, setPassageirosReload] = useState(0);
  const [exportandoEvento, setExportandoEvento] = useState<'excel' | 'pdf' | null>(null);
  
  const [termoPesquisa, setTermoPesquisa] = useState('');

  // Estados dos Modais (Visibilidade)
  const [isViagemModalOpen, setIsViagemModalOpen] = useState(false);
  const [isPassageiroModalOpen, setIsPassageiroModalOpen] = useState(false);
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [isMotoristaModalOpen, setIsMotoristaModalOpen] = useState(false);
  const [isEnderecoModalOpen, setIsEnderecoModalOpen] = useState(false);
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

  const carregarRecursosGlobais = async () => {
    const [enderecosResponse, motoristasResponse, veiculosResponse] = await Promise.all([
      apiCore.get<Endereco[]>('/enderecos'),
      apiCore.get<Motorista[]>('/motoristas'),
      apiCore.get<Veiculo[]>('/veiculos'),
    ]);
    setEnderecos(enderecosResponse.data);
    setMotoristas(motoristasResponse.data);
    setVeiculos(veiculosResponse.data);
    return {
      enderecos: enderecosResponse.data,
      motoristas: motoristasResponse.data,
      veiculos: veiculosResponse.data,
    };
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
    void Promise.resolve().then(() => carregarRecursosGlobais());
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
      let response;
      if (eventoPayload.id) {
        response = await apiCore.put<Evento>(`/eventos/${eventoPayload.id}`, eventoPayload);
      } else {
        response = await apiCore.post<Evento>('/eventos', eventoPayload);
      }
      const eventoSalvo = response.data;
      const eventosAtualizados = await apiCore.get<Evento[]>('/eventos');
      setEventos(eventosAtualizados.data);
      await carregarRecursosGlobais();
      if (eventoSalvo.id) {
        setEventoSelecionado(eventoSalvo);
        setViagemSelecionada(null);
        setPassageirosDaViagem([]);
        await carregarViagensDoEvento(eventoSalvo.id);
      }
    } catch (error) {
      alert(apiErrorMessage(error, "Erro ao guardar o evento. Verifique os dados."));
    }
  };

  const handleSaveViagem = async (viagemPayload: Viagens) => {
    try {
      const recursos = await carregarRecursosGlobais();
      const origemAtual = recursos.enderecos.find(endereco => endereco.id === viagemPayload.localDeOrigem?.id);
      const destinoAtual = recursos.enderecos.find(endereco => endereco.id === viagemPayload.localDeDestino?.id);
      const motoristaAtual = recursos.motoristas.find(motorista => motorista.id === viagemPayload.idMotorista?.id);
      const veiculoAtual = recursos.veiculos.find(veiculo => veiculo.idPlaca === viagemPayload.idVeiculo);
      if (!origemAtual || !destinoAtual) {
        throw new Error('O endereço de origem ou destino não existe mais. Cadastre ou selecione um endereço atualizado.');
      }
      if (!motoristaAtual || !veiculoAtual) {
        throw new Error('O motorista ou veículo selecionado não existe mais. Atualize os recursos e tente novamente.');
      }
      const payloadAtualizado = { ...viagemPayload, localDeOrigem: origemAtual, localDeDestino: destinoAtual, idMotorista: motoristaAtual, idVeiculo: veiculoAtual.idPlaca };
      if (viagemPayload.id) {
        await apiCore.put(`/viagens/${viagemPayload.id}`, payloadAtualizado);
      } else {
        await apiCore.post('/viagens', payloadAtualizado);
      }
      setIsViagemModalOpen(false);
      setViagemEmEdicao(null);
      if (eventoSelecionado) {
        const result = await carregarViagensDoEvento(eventoSelecionado.id!);
        const viagemAtualizada = result.viagens.find(item => item.id === viagemPayload.id);
        if (result.isCurrent && viagemAtualizada) setViagemSelecionada(viagemAtualizada);
      }
    } catch (error) {
      alert(apiErrorMessage(error, "Erro ao salvar viagem. Verifique os dados selecionados."));
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
    } catch (error) {
      alert(apiErrorMessage(error, "Erro ao salvar passageiro. Verifique os dados."));
    }
  };

  const handleDeletePassageiro = async (id: number) => {
    if (!window.confirm('Excluir este passageiro da viagem?')) return;
    try {
      await apiCore.delete(`/passageiros/${id}`);
      setPassageirosReload((current) => current + 1);
    } catch (error) {
      alert(apiErrorMessage(error, 'Erro ao excluir passageiro.'));
    }
  };

  const handleSaveVeiculo = async (veiculoPayload: Veiculo) => {
    try {
      await apiCore.post('/veiculos', veiculoPayload);
      setIsVeiculoModalOpen(false);
      void carregarRecursosGlobais(); // Atualiza dropdowns
    } catch (error) {
      alert(apiErrorMessage(error, "Erro ao salvar veículo. Verifique placa, ano e campos obrigatórios."));
    }
  };

  const handleSaveMotorista = async (motoristaPayload: Motorista) => {
    try {
      await apiCore.post('/motoristas', motoristaPayload);
      setIsMotoristaModalOpen(false);
      void carregarRecursosGlobais(); // Atualiza dropdowns
    } catch (error) {
      alert(apiErrorMessage(error, "Erro ao salvar motorista. Verifique nome, RG e CPF."));
    }
  };

  const handleSaveEndereco = async (enderecoPayload: Endereco) => {
    try {
      await apiCore.post('/enderecos', enderecoPayload);
      setIsEnderecoModalOpen(false);
      void carregarRecursosGlobais();
    } catch (error) {
      alert(apiErrorMessage(error, 'Erro ao salvar endereço. Verifique os campos obrigatórios.'));
    }
  };

  const handleDeleteEvento = async (id: number) => {
    try {
      await apiCore.delete(`/eventos/${id}`);
      carregarEventos();
      handleNewEvento();
    } catch (error) {
      alert(apiErrorMessage(error, "Erro ao excluir o evento."));
    }
  };

  const handleExportarEvento = async (format: 'excel' | 'pdf') => {
    if (!eventoSelecionado?.id) return;

    setExportandoEvento(format);
    try {
      const response = await apiExport.get(`/eventos/${eventoSelecionado.id}/${format}`, {
        responseType: 'blob',
      });
      const contentDisposition = response.headers['content-disposition'];
      const fileNameMatch = typeof contentDisposition === 'string'
        ? contentDisposition.match(/filename="?([^";]+)"?/i)
        : null;
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const fileName = fileNameMatch?.[1] || `evento-${eventoSelecionado.id}.${extension}`;
      const fileUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      const formatName = format === 'excel' ? 'Excel' : 'PDF';
      let message = apiErrorMessage(error, `Erro ao exportar o evento para ${formatName}.`);
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await error.response.data.text()) as { message?: string };
          if (body.message) message = body.message;
        } catch {
          // Mantém a mensagem genérica quando a resposta não for JSON.
        }
      }
      alert(message);
    } finally {
      setExportandoEvento(null);
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
  const formatarDataHora = (value?: string) => {
    if (!value) return 'Data e horário não definidos';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

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
                  <div className="card-header-actions">
                    <button
                      className="icon-btn btn-add"
                      aria-label="Exportar evento para Excel"
                      title={exportandoEvento === 'excel' ? 'Gerando Excel...' : 'Exportar evento para Excel'}
                      onClick={() => void handleExportarEvento('excel')}
                      disabled={exportandoEvento !== null}
                    >
                      <FiDownload />
                    </button>
                    <button
                      className="icon-btn btn-add"
                      aria-label="Exportar evento para PDF"
                      title={exportandoEvento === 'pdf' ? 'Gerando PDF...' : 'Exportar evento para PDF'}
                      onClick={() => void handleExportarEvento('pdf')}
                      disabled={exportandoEvento !== null}
                    >
                      <FiFileText />
                    </button>
                    <button className="icon-btn btn-add" aria-label="Adicionar viagem" title="Adicionar viagem" onClick={() => { setViagemEmEdicao(null); setIsViagemModalOpen(true); }}><FiPlus /></button>
                  </div>
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
                        <span className="trip-driver">{[viagem.idMotorista?.nome, viagem.idMotorista?.sobrenome].filter(Boolean).join(' ') || 'Motorista não informado'}</span>
                        <span className="trip-vehicle">Veículo: <strong>{viagem.idVeiculo}</strong></span>
                        <small className="trip-date">{formatarDataHora(viagem.dataHora)}</small>
                      </span>
                      
                      <div className="item-actions">
                        <button
                          onClick={(e) => handleDeleteViagem(e, viagem.id!)}
                          className="icon-btn btn-danger-outline"
                          aria-label="Excluir viagem"
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
              <div className="logistics-add-section">
                <h4 className="sub-title">Adicionar</h4>
                <div className="logistics-actions">
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
                <button
                  className="btn-sm btn-add"
                  style={{ flex: 1, padding: '8px' }}
                  onClick={() => setIsEnderecoModalOpen(true)}
                >
                  <FiMapPin /> Endereço
                </button>
                </div>
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

      {isEnderecoModalOpen && <ModalEndereco
        isOpen={isEnderecoModalOpen}
        onClose={() => setIsEnderecoModalOpen(false)}
        onSave={handleSaveEndereco}
      />}

    </div>
  );
}
