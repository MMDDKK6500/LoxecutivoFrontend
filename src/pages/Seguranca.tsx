import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/layout/Navbar';
import { apiAuth } from '../services/apiAuth';

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
    <section className="content records-content">
      <div className="card" style={{ maxWidth: 680, width: '100%', margin: '0 auto', overflowY: 'auto' }}>
        <h2>Segurança da conta</h2>
        <p>Verificação em duas etapas: {enabled === null ? 'consultando…' : enabled ? 'ativa' : 'desativada'}.</p>
        <p>Use um aplicativo como Google Authenticator ou Microsoft Authenticator para confirmar seus logins.</p>
        {message && <p role="status">{message}</p>}
        {enabled !== null && <form onSubmit={e => { e.preventDefault(); void submit(); }}>
          {!setup && <div className="form-group"><label htmlFor="security-password">Senha atual</label><input id="security-password" type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required /></div>}
          {setup && <>
            <p>Escaneie o QR Code no aplicativo ou informe a chave manualmente.</p>
            <img src={setup.qrCode} alt="QR Code para configurar o autenticador" style={{ maxWidth: '100%' }} />
            <p style={{ overflowWrap: 'anywhere' }}>{setup.secret}</p>
            <p>Guarde estes códigos em um local seguro antes de continuar. Cada código permite um login se você perder o acesso ao aplicativo e só pode ser usado uma vez.</p>
            <pre style={{ overflowX: 'auto', padding: 16 }}>{setup.recoveryCodes.join('\n')}</pre>
            <label><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} required /> Guardei meus códigos de recuperação.</label>
          </>}
          {(setup || enabled) && <div className="form-group"><label htmlFor="security-code">{enabled ? 'Código do autenticador ou de recuperação' : 'Código de seis dígitos do aplicativo'}</label><input id="security-code" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} required maxLength={100} /></div>}
          <button className="btn btn-save" disabled={busy || Boolean(setup && !saved)}>{busy ? 'Aguarde…' : enabled ? 'Desativar verificação' : setup ? 'Confirmar ativação' : 'Configurar verificação'}</button>
        </form>}
      </div>
    </section>
  </div>;
}
