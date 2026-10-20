import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FiEdit2, FiMapPin, FiPlus, FiRefreshCw, FiTrash2, FiTruck, FiUser } from 'react-icons/fi';
import Navbar from '../components/layout/Navbar';
import ModalEndereco from '../components/modals/ModalEndereco';
import ModalMotorista from '../components/modals/ModalMotorista';
import ModalVeiculo from '../components/modals/ModalVeiculo';
import { apiCore } from '../services/apiCore';
import type { Endereco, Motorista, Veiculo } from '../types';
import { formatCpf, formatRg } from '../utils/masks';

type CadastroKind = 'motoristas' | 'veiculos' | 'enderecos';
type CadastroItem = Motorista | Veiculo | Endereco;

const cadastroInfo: Record<CadastroKind, { title: string; singular: string; icon: typeof FiUser }> = {
  motoristas: { title: 'Motoristas cadastrados', singular: 'motorista', icon: FiUser },
  veiculos: { title: 'Veículos cadastrados', singular: 'veículo', icon: FiTruck },
  enderecos: { title: 'Endereços cadastrados', singular: 'endereço', icon: FiMapPin },
};

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return error instanceof Error ? error.message : fallback;
}

function recordId(kind: CadastroKind, item: CadastroItem) {
  if (kind === 'motoristas') return (item as Motorista).id;
  if (kind === 'veiculos') return (item as Veiculo).idPlaca;
  return (item as Endereco).id;
}

function recordTitle(kind: CadastroKind, item: CadastroItem) {
  if (kind === 'motoristas') {
    const driver = item as Motorista;
    return `${driver.nome} ${driver.sobrenome}`.trim();
  }
  if (kind === 'veiculos') {
    const vehicle = item as Veiculo;
    return `${vehicle.marca} ${vehicle.modelo}`.trim();
  }
  const address = item as Endereco;
  return `${address.rua}, ${address.numero}`;
}

function recordDetails(kind: CadastroKind, item: CadastroItem) {
  if (kind === 'motoristas') {
    const driver = item as Motorista;
    return [`CPF: ${formatCpf(driver.cpf)}`, `RG: ${formatRg(driver.rg)}`];
  }
  if (kind === 'veiculos') {
    const vehicle = item as Veiculo;
    return [`Placa: ${vehicle.idPlaca}`, `Ano: ${vehicle.ano}`, `Cor: ${vehicle.cor}`];
  }
  const address = item as Endereco;
  return [`${address.bairro}`, `${address.cidade}/${address.uf}`];
}

export default function Cadastros() {
  const { tipo } = useParams<{ tipo: string }>();
  const navigate = useNavigate();
  const kind = tipo as CadastroKind;
  const validKind = tipo === 'motoristas' || tipo === 'veiculos' || tipo === 'enderecos';
  const info = validKind ? cadastroInfo[kind] : null;
  const [items, setItems] = useState<CadastroItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CadastroItem | null>(null);

  const loadItems = useCallback(async () => {
    if (!validKind) return;
    setLoading(true);
    setLoadError('');
    try {
      const response = await apiCore.get<CadastroItem[]>(`/${kind}`);
      setItems(response.data);
    } catch (error) {
      setLoadError(errorMessage(error, `Não foi possível carregar ${info?.title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }, [info?.title, kind, validKind]);

  useEffect(() => {
    void Promise.resolve().then(loadItems);
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return items;
    return items.filter((item) => [recordTitle(kind, item), ...recordDetails(kind, item)]
      .join(' ')
      .toLocaleLowerCase('pt-BR')
      .includes(query));
  }, [items, kind, search]);

  if (!validKind || !info) return <Navigate to="/dashboard" replace />;

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: CadastroItem) => {
    setEditing(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  };

  const saveItem = async (item: CadastroItem) => {
    setSaving(true);
    try {
      const id = editing ? recordId(kind, editing) : undefined;
      if (id !== undefined && id !== null) {
        await apiCore.put(`/${kind}/${encodeURIComponent(String(id))}`, item);
      } else {
        await apiCore.post(`/${kind}`, item);
      }
      setModalOpen(false);
      setEditing(null);
      await loadItems();
    } catch (error) {
      window.alert(errorMessage(error, `Não foi possível salvar o ${info.singular}.`));
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item: CadastroItem) => {
    const id = recordId(kind, item);
    if (id === undefined || id === null) return;
    if (!window.confirm(`Excluir ${info.singular} "${recordTitle(kind, item)}"?`)) return;
    try {
      await apiCore.delete(`/${kind}/${encodeURIComponent(String(id))}`);
      await loadItems();
    } catch (error) {
      window.alert(errorMessage(error, `Não foi possível excluir o ${info.singular}. Pode haver viagens ou eventos usando este cadastro.`));
    }
  };

  const Icon = info.icon;

  return (
    <div className="main">
      <Navbar searchTerm={search} onSearchChange={setSearch} onLogout={() => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }} />
      <section className="content records-content">
        <div className="card records-card">
          <div className="card-header records-header">
            <div className="records-heading">
              <span className="records-heading-icon"><Icon aria-hidden="true" /></span>
              <div>
                <h3>{info.title}</h3>
                <p>{filteredItems.length} {filteredItems.length === 1 ? 'registro encontrado' : 'registros encontrados'}</p>
              </div>
            </div>
            <div className="card-header-actions">
              <button className="icon-btn btn-add" aria-label={`Adicionar ${info.singular}`} title={`Adicionar ${info.singular}`} onClick={openNew}>
                <FiPlus aria-hidden="true" />
              </button>
              <button className="icon-btn btn-refresh" aria-label="Atualizar lista" title="Atualizar lista" onClick={() => void loadItems()} disabled={loading}>
                <FiRefreshCw aria-hidden="true" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="placeholder"><p>Carregando cadastros...</p></div>
          ) : loadError ? (
            <div className="records-message records-error">
              <p>{loadError}</p>
              <button className="btn-sm btn-add" onClick={() => void loadItems()}><FiRefreshCw aria-hidden="true" /> Tentar novamente</button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="placeholder"><p>{items.length ? 'Nenhum cadastro corresponde à pesquisa.' : `Nenhum ${info.singular} cadastrado.`}</p></div>
          ) : (
            <ul className="item-list records-list">
              {filteredItems.map((item) => {
                const id = recordId(kind, item);
                return (
                  <li className="record-row" key={String(id ?? recordTitle(kind, item))}>
                    <div className="record-copy">
                      <strong>{recordTitle(kind, item)}</strong>
                      <div className="record-details">
                        {recordDetails(kind, item).map((detail) => <span key={detail}>{detail}</span>)}
                      </div>
                    </div>
                    <div className="item-actions record-actions">
                      <button className="icon-btn btn-edit" aria-label={`Editar ${info.singular}`} title={`Editar ${info.singular}`} onClick={() => openEdit(item)}>
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      <button className="icon-btn btn-danger-outline" aria-label={`Excluir ${info.singular}`} title={`Excluir ${info.singular}`} onClick={() => void removeItem(item)}>
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {kind === 'motoristas' && modalOpen && (
        <ModalMotorista key={editing ? `motorista-${(editing as Motorista).id}` : 'novo-motorista'} isOpen onClose={closeModal} onSave={saveItem} motoristaEdit={editing as Motorista | null} />
      )}
      {kind === 'veiculos' && modalOpen && (
        <ModalVeiculo key={editing ? `veiculo-${(editing as Veiculo).idPlaca}` : 'novo-veiculo'} isOpen onClose={closeModal} onSave={saveItem} veiculoEdit={editing as Veiculo | null} />
      )}
      {kind === 'enderecos' && modalOpen && (
        <ModalEndereco key={editing ? `endereco-${(editing as Endereco).id}` : 'novo-endereco'} isOpen onClose={closeModal} onSave={saveItem} enderecoEdit={editing as Endereco | null} />
      )}
    </div>
  );
}
