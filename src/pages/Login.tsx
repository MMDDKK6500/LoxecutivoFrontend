import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiAuth } from '../services/apiAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [challenge, setChallenge] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (busy) return;
    setBusy(true);

    try {
      const response = challenge
        ? await apiAuth.post('/2fa/verify', { challengeToken: challenge, code })
        : await apiAuth.post('/login', { email, senha });
      if (response.data.requiresTwoFactor) {
        setChallenge(response.data.challengeToken);
        setSenha('');
        return;
      }
      if (response.data.auth && response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/'); // Redireciona para o Dashboard protegido
      } else {
        setErro(response.data.message || 'Não foi possível autenticar. Verifique as suas credenciais.');
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      setErro(message || 'Erro ao realizar login. Verifique as suas credenciais.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9' }}>
      <div className="modal-content" style={{ width: '400px', padding: '40px', display: 'block' }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '25px' }}>Loxecutivo - Acesso</h2>
        
        {erro && (
          <div style={{ backgroundColor: '#f8d7da', color: '#dc3545', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {challenge ? <div className="form-group">
            <label htmlFor="login-code">Código do autenticador ou de recuperação</label>
            <input id="login-code" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} required maxLength={100} />
            <button type="button" onClick={() => { setChallenge(''); setCode(''); setErro(''); }}>Voltar ao login</button>
          </div> : <>
          <div className="form-group">
            <label>E-mail:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@loxecutivo.com"
              required 
            />
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>Palavra-passe:</label>
            <input 
              type="password" 
              value={senha} 
              onChange={(e) => setSenha(e.target.value)} 
              placeholder="********"
              required 
            />
          </div>

          </>}
          <div className="form-actions" style={{ marginTop: '25px' }}>
            <button disabled={busy} type="submit" className="btn btn-save" style={{ width: '100%' }}>
              {busy ? 'Verificando…' : challenge ? 'Confirmar código' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
