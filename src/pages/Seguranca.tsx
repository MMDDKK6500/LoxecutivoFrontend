import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/layout/Navbar';
import { apiAuth } from '../services/apiAuth';
import { FiShield, FiSmartphone, FiKey, FiCheckCircle } from 'react-icons/fi';

interface Setup { secret: string; qrCode: string; recoveryCodes: string[] }
export default function Seguranca() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [senha, setSenha] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  useEffect(() => {
    apiAuth.get('/2fa/status', { headers: headers() }).then(r => setEnabled(r.data.enabled))
      .catch(() => setMessage('Não foi possível consultar a segurança da conta. Atualize a página para tentar novamente.'));
  }, []);
  const submit = async () => {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const action = enabled ? 'disable' : setup ? 'enable' : 'setup';
      const { data } = await apiAuth.post(`/2fa/${action}`, { senha, code }, { headers: headers() });
      if (action === 'setup') { setSetup(data); setSenha(''); }
      else { setEnabled(data.enabled); setSetup(null); setSenha(''); setCode(''); setSaved(false); setMessage(data.enabled ? 'Verificação em duas etapas ativada!' : 'Verificação em duas etapas desativada.'); }
    } catch (error) {
      setMessage(axios.isAxiosError(error) ? error.response?.data?.message || 'Não foi possível concluir. Tente novamente.' : 'Não foi possível concluir.');
    } finally { setBusy(false); }
  };
  return <div className="main">
    <Navbar onLogout={() => { localStorage.removeItem('token'); window.location.assign('/login'); }} />
    <section className="content records-content security-page">
      <div className="card security-card">
        <header className="security-heading">
          <span className="security-icon"><FiShield aria-hidden="true" /></span>
          <div><h2>Segurança da conta</h2><p>Uma camada extra de proteção para seus acessos.</p></div>
        </header>
        <div className="security-overview">
          <div><h3>Verificação em duas etapas</h3><p>Use um aplicativo como Google Authenticator ou Microsoft Authenticator para confirmar seus logins.</p></div>
          <span className={`security-badge ${enabled ? 'is-active' : ''}`}>{enabled === null ? 'Consultando…' : enabled ? 'Ativa' : 'Desativada'}</span>
        </div>
        {message && <p className="security-message" role="status">{message}</p>}
        {enabled !== null && <form className="security-form" onSubmit={e => { e.preventDefault(); void submit(); }}>
          {!setup && <div className="form-group"><label htmlFor="security-password">Senha atual</label><input id="security-password" type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required /></div>}
          {setup && <>
            <section className="security-step">
            <h3><FiSmartphone aria-hidden="true" /> 1. Configure o aplicativo</h3>
            <p>Escaneie o QR Code no aplicativo ou informe a chave manualmente.</p>
            <div className="security-qr"><img src={setup.qrCode} alt="QR Code para configurar o autenticador" /></div>
            <span className="security-key-label">Chave de configuração manual</span>
            <code className="security-secret">{setup.secret}</code>
            </section>
            <section className="security-step">
            <h3><FiKey aria-hidden="true" /> 2. Guarde os códigos de recuperação</h3>
            <p>Guarde estes códigos em um local seguro antes de continuar. Cada código permite um login se você perder o acesso ao aplicativo e só pode ser usado uma vez.</p>
            <ul className="security-recovery-codes">{setup.recoveryCodes.map(value => <li key={value}><code>{value}</code></li>)}</ul>
            <label className="security-confirm"><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} required /> Guardei meus códigos de recuperação.</label>
            </section>
            <h3 className="security-confirm-heading"><FiCheckCircle aria-hidden="true" /> 3. Confirme a ativação</h3>
          </>}
          {(setup || enabled) && <div className="form-group"><label htmlFor="security-code">{enabled ? 'Código do autenticador ou de recuperação' : 'Código de seis dígitos do aplicativo'}</label><input id="security-code" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} required maxLength={100} /></div>}
          <div className="security-actions"><button className={`btn ${enabled ? 'security-disable' : 'btn-save'}`} disabled={busy || Boolean(setup && !saved)}><FiShield aria-hidden="true" />{busy ? 'Aguarde…' : enabled ? 'Desativar verificação' : setup ? 'Confirmar ativação' : 'Configurar verificação'}</button></div>
        </form>}
      </div>
    </section>
  </div>;
}
