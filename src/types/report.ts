export interface CompanyReportSummary {
  totalViagens: number;
  agendadas: number;
  realizadas: number;
  canceladas: number;
  passageirosTransportados: number;
  mediaPassageirosPorViagemRealizada: number;
  eventosAtendidos: number;
  motoristasUtilizados: number;
  veiculosUtilizados: number;
  motoristasCadastrados: number;
  veiculosCadastrados: number;
  enderecosCadastrados: number;
  picoDia: string;
  picoHorario: string;
}

export interface CompanyReportUsage {
  id?: number | string;
  nome: string;
  realizadas: number;
  agendadas: number;
  canceladas: number;
  passageiros: number;
}

export interface CompanyVehicleUsage {
  placa: string;
  marca: string;
  modelo: string;
  realizadas: number;
  agendadas: number;
  canceladas: number;
  passageiros: number;
}

export interface CompanyDayUsage {
  nome: string;
  viagens: number;
  realizadas: number;
  agendadas: number;
  canceladas: number;
}

export interface CompanyHourUsage extends Omit<CompanyDayUsage, 'nome'> {
  hora: string;
}

export interface CompanyEventUsage {
  id?: number | string;
  nome: string;
  endereco: string;
  realizadas: number;
  agendadas: number;
  canceladas: number;
  passageiros: number;
}

export interface CompanyRouteUsage {
  origem: string;
  destino: string;
  realizadas: number;
  agendadas: number;
  canceladas: number;
}

export interface CompanyReport {
  period: { from: string | null; to: string | null };
  summary: CompanyReportSummary;
  drivers: CompanyReportUsage[];
  vehicles: CompanyVehicleUsage[];
  events: CompanyEventUsage[];
  weekdays: CompanyDayUsage[];
  hours: CompanyHourUsage[];
  routes: CompanyRouteUsage[];
}

export interface WeeklyReportMetadata {
  id: string;
  generatedAt: string;
  period: { from: string | null; to: string | null };
  summary: CompanyReportSummary;
}
