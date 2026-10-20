export interface Endereco {
  id?: number;
  rua: string;
  numero: number;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Evento {
  id?: number;
  nome: string;
  idEndereco: Endereco;
}

export interface Motorista {
  id?: number;
  nome: string;
  sobrenome: string;
  rg: string;
  cpf: string;
}

export interface Veiculo {
  idPlaca: string; // No Java, a placa é o @Id do veículo
  modelo: string;
  ano: number;
  marca: string;
  cor: string;
}

export interface Viagens {
  id?: number;
  localDeOrigem: Endereco;
  localDeDestino: Endereco;
  idMotorista: Motorista;
  idVeiculo: string; // Guarda a placa do veículo selecionado
  idEvento?: Evento;
}

export interface Passageiro {
  id?: number;
  nome: string;
  sobrenome: string;
  numero: string;
  empresa: string;
  rg: string;
  cpf: string;
  idViagem?: Viagens;
}