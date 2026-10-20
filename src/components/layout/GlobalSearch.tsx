import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { FiCalendar, FiMapPin, FiTruck, FiUser } from 'react-icons/fi';
import { apiCore } from '../../services/apiCore';
import type { Endereco, Evento, Motorista, Veiculo, Viagens } from '../../types';
import { formatCpf, formatRg } from '../../utils/masks';

interface GlobalSearchProps {
  value: string;
  onChange: (value: string) => void;
}

interface SearchData {
  eventos: Evento[];
  viagens: Viagens[];
  motoristas: Motorista[];
  veiculos: Veiculo[];
  enderecos: Endereco[];
}

type ResultType = 'evento' | 'viagem' | 'motorista' | 'veiculo' | 'endereco';

interface SearchResult {
  key: string;
  type: ResultType;
  label: string;
  title: string;
  description: string;
  target: string;
}

const resultIcons = {
  evento: FiCalendar,
  viagem: FiTruck,
  motorista: FiUser,
  veiculo: FiTruck,
  endereco: FiMapPin,
};

const emptyData: SearchData = {
  eventos: [],
  viagens: [],
  motoristas: [],
  veiculos: [],
  enderecos: [],
};

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matches(query: string, values: unknown[]) {
  const normalizedQuery = normalize(query);
  const searchable = normalize(values.join(' '));
  if (!normalizedQuery) return false;
  return searchable.includes(normalizedQuery)
    || searchable.replace(/\s/g, '').includes(normalizedQuery.replace(/\s/g, ''));
}

function addressLabel(address?: Endereco) {
  if (!address) return 'Endereço não informado';
  return `${address.rua}, ${address.numero} — ${address.bairro}, ${address.cidade}/${address.uf}`;
}

function driverName(driver?: Motorista) {
  return driver ? `${driver.nome} ${driver.sobrenome}`.trim() : 'Motorista não informado';
}

export default function GlobalSearch({ value, onChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const requestInProgress = useRef(false);
  const mounted = useRef(true);
  const [data, setData] = useState<SearchData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2 || loaded || requestInProgress.current) return;

    requestInProgress.current = true;
    setLoading(true);
    setFailed(false);
    Promise.all([
      apiCore.get<Evento[]>('/eventos'),
      apiCore.get<Viagens[]>('/viagens'),
      apiCore.get<Motorista[]>('/motoristas'),
      apiCore.get<Veiculo[]>('/veiculos'),
      apiCore.get<Endereco[]>('/enderecos'),
    ])
      .then(([eventos, viagens, motoristas, veiculos, enderecos]) => {
        if (!mounted.current) return;
        setData({
          eventos: eventos.data,
          viagens: viagens.data,
          motoristas: motoristas.data,
          veiculos: veiculos.data,
          enderecos: enderecos.data,
        });
        setLoaded(true);
      })
      .catch(() => {
        if (mounted.current) setFailed(true);
      })
      .finally(() => {
        requestInProgress.current = false;
        if (mounted.current) setLoading(false);
      });
  }, [loaded, value]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (value.trim().length < 2) return [];

    const eventos = data.eventos
      .filter((evento) => matches(value, [evento.nome, addressLabel(evento.idEndereco)]))
      .map((evento) => ({
        key: `evento-${evento.id}`,
        type: 'evento' as const,
        label: 'Evento',
        title: evento.nome,
        description: addressLabel(evento.idEndereco),
        target: `/dashboard?evento=${evento.id}`,
      }));

    const viagens = data.viagens
      .filter((viagem) => {
        const vehicle = data.veiculos.find((item) => item.idPlaca === viagem.idVeiculo);
        return matches(value, [
          viagem.idEvento?.nome,
          addressLabel(viagem.localDeOrigem),
          addressLabel(viagem.localDeDestino),
          driverName(viagem.idMotorista),
          viagem.idMotorista?.cpf,
          viagem.idMotorista?.rg,
          viagem.idVeiculo,
          vehicle?.marca,
          vehicle?.modelo,
          vehicle?.cor,
          viagem.dataHora,
        ]);
      })
      .filter((viagem) => viagem.id !== undefined && viagem.idEvento?.id !== undefined)
      .map((viagem) => ({
        key: `viagem-${viagem.id}`,
        type: 'viagem' as const,
        label: 'Viagem',
        title: `${viagem.idEvento?.nome ?? 'Evento'} · ${driverName(viagem.idMotorista)}`,
        description: `${addressLabel(viagem.localDeOrigem)} → ${addressLabel(viagem.localDeDestino)}`,
        target: `/dashboard?evento=${viagem.idEvento?.id}&viagem=${viagem.id}`,
      }));

    const motoristas = data.motoristas
      .filter((motorista) => matches(value, [driverName(motorista), motorista.cpf, motorista.rg]))
      .map((motorista) => ({
        key: `motorista-${motorista.id}`,
        type: 'motorista' as const,
        label: 'Motorista',
        title: driverName(motorista),
        description: `CPF ${formatCpf(motorista.cpf)} · RG ${formatRg(motorista.rg)}`,
        target: `/cadastros/motoristas?q=${encodeURIComponent(driverName(motorista))}`,
      }));

    const veiculos = data.veiculos
      .filter((veiculo) => matches(value, [veiculo.idPlaca, veiculo.marca, veiculo.modelo, veiculo.cor, veiculo.ano]))
      .map((veiculo) => ({
        key: `veiculo-${veiculo.idPlaca}`,
        type: 'veiculo' as const,
        label: 'Veículo',
        title: `${veiculo.marca} ${veiculo.modelo}`.trim(),
        description: `${veiculo.idPlaca} · ${veiculo.cor} · ${veiculo.ano}`,
        target: `/cadastros/veiculos?q=${encodeURIComponent(veiculo.idPlaca)}`,
      }));

    const enderecos = data.enderecos
      .filter((endereco) => matches(value, [addressLabel(endereco)]))
      .map((endereco) => ({
        key: `endereco-${endereco.id}`,
        type: 'endereco' as const,
        label: 'Endereço',
        title: `${endereco.rua}, ${endereco.numero}`,
        description: `${endereco.bairro} · ${endereco.cidade}/${endereco.uf}`,
        target: `/cadastros/enderecos?q=${encodeURIComponent(`${endereco.rua}, ${endereco.numero}`)}`,
      }));

    return [...eventos, ...viagens, ...motoristas, ...veiculos, ...enderecos].slice(0, 30);
  }, [data, value]);

  const showResults = open && value.trim().length >= 2;

  return (
    <div className="search-box global-search" ref={containerRef}>
      <input
        type="search"
        placeholder="Pesquisar tudo..."
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
        role="combobox"
        aria-label="Pesquisar eventos, viagens, motoristas, veículos e endereços"
        aria-expanded={showResults}
        aria-controls="global-search-results"
        aria-autocomplete="list"
      />
      <FaSearch className="search-icon" aria-hidden="true" />

      {showResults && (
        <div className="search-results" id="global-search-results" role="listbox">
          {loading ? (
            <p className="search-status">Pesquisando...</p>
          ) : failed ? (
            <p className="search-status search-error">Não foi possível carregar a pesquisa.</p>
          ) : results.length === 0 ? (
            <p className="search-status">Nenhum resultado encontrado.</p>
          ) : (
            results.map((result) => {
              const Icon = resultIcons[result.type];
              return (
                <button
                  type="button"
                  className="search-result"
                  key={result.key}
                  role="option"
                  aria-selected="false"
                  onClick={() => {
                    setOpen(false);
                    onChange('');
                    navigate(result.target);
                  }}
                >
                  <span className={`search-result-icon search-result-${result.type}`}><Icon aria-hidden="true" /></span>
                  <span className="search-result-copy">
                    <span className="search-result-type">{result.label}</span>
                    <strong>{result.title}</strong>
                    <small>{result.description}</small>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
