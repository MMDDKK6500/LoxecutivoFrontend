import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiActivity, FiCalendar, FiDownload, FiFileText, FiRefreshCw, FiTruck, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useToast } from '../contexts/useToast';
import { apiExport } from '../services/apiExport';
import type { CompanyReport, WeeklyReportMetadata } from '../types/report';

type ReportFormat = 'excel' | 'pdf';

function reportError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return error instanceof Error ? error.message : fallback;
}

function displayPeriod(report: CompanyReport) {
  const format = (value: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '';
  if (!report.period.from && !report.period.to) return 'Todo o período cadastrado';
  return `${report.period.from ? format(report.period.from) : 'Sem data inicial'} até ${report.period.to ? format(report.period.to) : 'sem data final'}`;
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof FiActivity; tone: string }) {
  return (
    <article className={`report-stat-card ${tone}`}>
      <span className="report-stat-icon"><Icon aria-hidden="true" /></span>
      <div><span>{label}</span><strong>{value}</strong></div>
    </article>
  );
}

export default function Relatorios() {
  const navigate = useNavigate();
  const notify = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState<{ de?: string; ate?: string }>({});
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<ReportFormat | null>(null);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReportMetadata[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState('');
  const [downloadingWeeklyId, setDownloadingWeeklyId] = useState<string | null>(null);

  const params = useMemo(() => ({ ...filters }), [filters]);
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const response = await apiExport.get<CompanyReport>('/relatorio-geral', { params });
      setReport(response.data);
    } catch (requestError) {
      setError(reportError(requestError, 'Não foi possível carregar o relatório geral.'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { void Promise.resolve().then(loadReport); }, [loadReport]);

  const loadWeeklyReports = useCallback(async () => {
    setWeeklyLoading(true);
    setWeeklyError('');
    try {
      const response = await apiExport.get<WeeklyReportMetadata[]>('/relatorio-geral/semanais');
      setWeeklyReports(response.data);
    } catch (requestError) {
      setWeeklyError(reportError(requestError, 'Não foi possível carregar os relatórios semanais.'));
    } finally { setWeeklyLoading(false); }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadWeeklyReports); }, [loadWeeklyReports]);

  const downloadWeeklyReport = async (id: string) => {
    setDownloadingWeeklyId(id);
    try {
      const response = await apiExport.get(`/relatorio-geral/semanais/${id}/pdf`, { responseType: 'blob' });
      const fileUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `relatorio-semanal-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileUrl);
    } catch (downloadError) {
      notify(reportError(downloadError, 'Não foi possível baixar o relatório semanal.'), 'error');
    } finally { setDownloadingWeeklyId(null); }
  };

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError('A data inicial não pode ser posterior à data final.');
      return;
    }
    setFilters({ de: dateFrom || undefined, ate: dateTo || undefined });
  };

  const exportReport = async (format: ReportFormat) => {
    setExporting(format);
    try {
      const response = await apiExport.get(`/relatorio-geral/${format}`, { params, responseType: 'blob' });
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const filename = response.headers['content-disposition']?.match(/filename="?([^";]+)"?/i)?.[1]
        || `relatorio-geral.${extension}`;
      const fileUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileUrl);
      notify(`Relatório ${format === 'excel' ? 'Excel' : 'PDF'} gerado com sucesso!`);
    } catch (exportError) {
      let message = reportError(exportError, 'Não foi possível gerar o relatório.');
      if (axios.isAxiosError(exportError) && exportError.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await exportError.response.data.text()) as { message?: string };
          if (body.message) message = body.message;
        } catch { /* Usa a mensagem de fallback quando a resposta não é JSON. */ }
      }
      notify(message, 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="main">
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} onLogout={() => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }} />
      <section className="content records-content report-page">
        <header className="report-page-heading">
          <div>
            <span className="report-eyebrow">GESTÃO E OPERAÇÃO</span>
            <h1>Relatório geral</h1>
            <p>Indicadores calculados a partir das viagens e cadastros existentes no sistema.</p>
          </div>
          <div className="report-export-actions">
            <button type="button" className="btn-sm report-excel-button" onClick={() => void exportReport('excel')} disabled={!report || loading || exporting !== null}>
              <FiDownload aria-hidden="true" /> {exporting === 'excel' ? 'Gerando Excel…' : 'Exportar Excel'}
            </button>
            <button type="button" className="btn-sm report-pdf-button" onClick={() => void exportReport('pdf')} disabled={!report || loading || exporting !== null}>
              <FiFileText aria-hidden="true" /> {exporting === 'pdf' ? 'Gerando PDF…' : 'Exportar PDF'}
            </button>
          </div>
        </header>

        <form className="report-filter-card" onSubmit={applyFilters}>
          <div className="report-filter-title"><FiCalendar aria-hidden="true" /><div><strong>Filtrar período</strong><span>Deixe as datas vazias para incluir todo o histórico.</span></div></div>
          <label>Data inicial<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label>Data final<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} min={dateFrom || undefined} /></label>
          <button className="btn-sm btn-add" type="submit" disabled={loading}><FiActivity aria-hidden="true" /> Aplicar</button>
          <button className="icon-btn btn-refresh report-refresh" type="button" aria-label="Atualizar relatório" title="Atualizar relatório" onClick={() => void loadReport()} disabled={loading}><FiRefreshCw aria-hidden="true" /></button>
        </form>

        <section className="card report-weekly-card">
          <div className="report-weekly-heading">
            <div><h2>Relatórios semanais</h2><p>PDFs gerados automaticamente aos domingos.</p></div>
            <button className="icon-btn btn-refresh report-refresh" type="button" aria-label="Atualizar relatórios semanais" title="Atualizar relatórios semanais" onClick={() => void loadWeeklyReports()} disabled={weeklyLoading}><FiRefreshCw aria-hidden="true" /></button>
          </div>
          {weeklyError && <div className="report-error" role="alert">{weeklyError}</div>}
          {weeklyLoading ? <p className="report-weekly-empty">Carregando relatórios…</p>
            : weeklyReports.length === 0 ? <p className="report-weekly-empty">Ainda não há relatórios semanais armazenados.</p>
              : <div className="report-weekly-list">{weeklyReports.map((weekly) => (
                <article className="report-weekly-row" key={weekly.id}>
                  <span className="report-stat-icon"><FiFileText aria-hidden="true" /></span>
                  <div className="report-weekly-info">
                    <strong>Semana encerrada em {new Date(`${weekly.id}T00:00:00`).toLocaleDateString('pt-BR')}</strong>
                    <span>Gerado em {new Date(weekly.generatedAt).toLocaleString('pt-BR')} · {weekly.summary.totalViagens} viagens · {weekly.summary.realizadas} realizadas</span>
                  </div>
                  <button className="btn-sm report-pdf-button" type="button" onClick={() => void downloadWeeklyReport(weekly.id)} disabled={downloadingWeeklyId !== null}>
                    <FiDownload aria-hidden="true" /> {downloadingWeeklyId === weekly.id ? 'Baixando…' : 'Baixar PDF'}
                  </button>
                </article>
              ))}</div>}
        </section>

        {error && <div className="report-error" role="alert">{error}</div>}
        {loading ? <div className="card report-loading">Calculando indicadores…</div> : report && (
          <>
            <div className="report-period-caption">Período exibido: <strong>{displayPeriod(report)}</strong></div>
            <div className="report-stat-grid">
              <StatCard label="Viagens no período" value={report.summary.totalViagens} icon={FiActivity} tone="stat-blue" />
              <StatCard label="Realizadas" value={report.summary.realizadas} icon={FiActivity} tone="stat-green" />
              <StatCard label="Agendadas" value={report.summary.agendadas} icon={FiCalendar} tone="stat-amber" />
              <StatCard label="Canceladas" value={report.summary.canceladas} icon={FiActivity} tone="stat-red" />
              <StatCard label="Passageiros transportados" value={report.summary.passageirosTransportados} icon={FiUsers} tone="stat-blue" />
              <StatCard label="Eventos com viagens realizadas" value={report.summary.eventosAtendidos} icon={FiCalendar} tone="stat-violet" />
              <StatCard label="Motoristas utilizados" value={`${report.summary.motoristasUtilizados} / ${report.summary.motoristasCadastrados}`} icon={FiUsers} tone="stat-green" />
              <StatCard label="Veículos utilizados" value={`${report.summary.veiculosUtilizados} / ${report.summary.veiculosCadastrados}`} icon={FiTruck} tone="stat-violet" />
            </div>

            <div className="report-insight-row">
              <article className="card report-insight"><span>Média de passageiros por viagem realizada</span><strong>{report.summary.mediaPassageirosPorViagemRealizada}</strong></article>
              <article className="card report-insight"><span>Dia com maior movimento</span><strong>{report.summary.picoDia}</strong></article>
              <article className="card report-insight"><span>Horário com maior movimento</span><strong>{report.summary.picoHorario}</strong></article>
            </div>

            <div className="report-tables-grid">
              <article className="card report-table-card">
                <div className="report-table-heading"><h2>Utilização por motorista</h2><span>Contagem de viagens realizadas, agendadas e canceladas</span></div>
                <div className="report-table-scroll"><table><thead><tr><th>Motorista</th><th>Realizadas</th><th>Agendadas</th><th>Canceladas</th><th>Passageiros</th></tr></thead><tbody>
                  {report.drivers.length ? report.drivers.map((driver) => <tr key={String(driver.id ?? driver.nome)}><td>{driver.nome}</td><td>{driver.realizadas}</td><td>{driver.agendadas}</td><td>{driver.canceladas}</td><td>{driver.passageiros}</td></tr>) : <tr><td colSpan={5}>Nenhum motorista cadastrado.</td></tr>}
                </tbody></table></div>
              </article>

              <article className="card report-table-card">
                <div className="report-table-heading"><h2>Utilização por veículo</h2><span>Viagens concluídas e demanda prevista</span></div>
                <div className="report-table-scroll"><table><thead><tr><th>Veículo</th><th>Realizadas</th><th>Agendadas</th><th>Canceladas</th><th>Passageiros</th></tr></thead><tbody>
                  {report.vehicles.length ? report.vehicles.map((vehicle) => <tr key={vehicle.placa}><td>{[vehicle.marca, vehicle.modelo, vehicle.placa].filter(Boolean).join(' · ')}</td><td>{vehicle.realizadas}</td><td>{vehicle.agendadas}</td><td>{vehicle.canceladas}</td><td>{vehicle.passageiros}</td></tr>) : <tr><td colSpan={5}>Nenhum veículo cadastrado.</td></tr>}
                </tbody></table></div>
              </article>

              <article className="card report-table-card">
                <div className="report-table-heading"><h2>Demanda por dia da semana</h2><span>Distribuição com base na data agendada das viagens</span></div>
                <div className="report-table-scroll"><table><thead><tr><th>Dia</th><th>Total</th><th>Realizadas</th><th>Agendadas</th><th>Canceladas</th></tr></thead><tbody>
                  {report.weekdays.map((day) => <tr key={day.nome}><td>{day.nome}</td><td>{day.viagens}</td><td>{day.realizadas}</td><td>{day.agendadas}</td><td>{day.canceladas}</td></tr>)}
                </tbody></table></div>
              </article>

              <article className="card report-table-card">
                <div className="report-table-heading"><h2>Horários mais utilizados</h2><span>Faixas horárias com viagens cadastradas</span></div>
                <div className="report-table-scroll"><table><thead><tr><th>Faixa</th><th>Total</th><th>Realizadas</th><th>Agendadas</th><th>Canceladas</th></tr></thead><tbody>
                  {report.hours.filter((hour) => hour.viagens > 0).sort((a, b) => b.realizadas - a.realizadas || b.agendadas - a.agendadas).slice(0, 10).map((hour) => <tr key={hour.hora}><td>{hour.hora}</td><td>{hour.viagens}</td><td>{hour.realizadas}</td><td>{hour.agendadas}</td><td>{hour.canceladas}</td></tr>)}
                  {!report.hours.some((hour) => hour.viagens > 0) && <tr><td colSpan={5}>Nenhuma viagem com data e horário cadastrados.</td></tr>}
                </tbody></table></div>
              </article>

              <article className="card report-table-card">
                <div className="report-table-heading"><h2>Viagens por evento</h2><span>Viagens concluídas e demanda prevista por evento</span></div>
                <div className="report-table-scroll"><table><thead><tr><th>Evento</th><th>Realizadas</th><th>Agendadas</th><th>Canceladas</th><th>Passageiros</th></tr></thead><tbody>
                  {report.events.filter((event) => event.realizadas + event.agendadas + event.canceladas > 0).slice(0, 12).map((event) => <tr key={String(event.id ?? event.nome)}><td>{event.nome}</td><td>{event.realizadas}</td><td>{event.agendadas}</td><td>{event.canceladas}</td><td>{event.passageiros}</td></tr>)}
                  {!report.events.some((event) => event.realizadas + event.agendadas + event.canceladas > 0) && <tr><td colSpan={5}>Nenhum evento teve viagens no período.</td></tr>}
                </tbody></table></div>
              </article>

              <article className="card report-table-card">
                <div className="report-table-heading"><h2>Rotas mais utilizadas</h2><span>Origem e destino das viagens mais frequentes</span></div>
                <div className="report-table-scroll"><table><thead><tr><th>Origem</th><th>Destino</th><th>Realizadas</th><th>Agendadas</th><th>Canceladas</th></tr></thead><tbody>
                  {report.routes.slice(0, 10).map((route) => <tr key={`${route.origem}-${route.destino}`}><td>{route.origem}</td><td>{route.destino}</td><td>{route.realizadas}</td><td>{route.agendadas}</td><td>{route.canceladas}</td></tr>)}
                  {!report.routes.length && <tr><td colSpan={5}>Nenhuma rota cadastrada no período.</td></tr>}
                </tbody></table></div>
              </article>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
