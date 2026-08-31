import React, { useEffect, useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Link as LinkIcon, Unlink } from 'lucide-react';
import api from '../utils/api';

interface SettingsViewProps {
  user: any;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const [outlookStatus, setOutlookStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.get(`/api/auth/outlook/status?userEmail=${user.email}`);
      setOutlookStatus(res.data);
    } catch (error) {
      console.error('Erro ao buscar status do Outlook:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleConnect = async () => {
    try {
      const res = await api.get(`/api/auth/outlook?userEmail=${user.email}`);
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (error) {
      console.error('Erro ao conectar ao Outlook:', error);
      alert('Erro ao tentar iniciar a conexão com o Outlook.');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar sua conta do Outlook?')) return;
    try {
      await api.post(`/api/auth/outlook/disconnect`, { userEmail: user.email });
      setOutlookStatus({ connected: false });
    } catch (error) {
      console.error('Erro ao desconectar Outlook:', error);
      alert('Ocorreu um erro ao tentar desconectar.');
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurações</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">Gerencie suas integrações e preferências da plataforma.</p>
      </div>

      <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6">
        <h2 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-4">Integrações</h2>

        {/* Outlook Integration Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-gray-100 rounded-xl bg-gray-50/50">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Microsoft Outlook</h3>
              <p className="text-sm text-gray-500 mt-0.5">Sincronize e-mails e calendário para insights no dashboard.</p>

              {loading ? (
                <div className="mt-2 text-xs text-gray-400 font-medium">Verificando status...</div>
              ) : outlookStatus?.connected ? (
                <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Conectado como: {outlookStatus.outlookEmail}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-gray-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Não conectado
                </div>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto flex justify-end">
            {!loading && (
              outlookStatus?.connected ? (
                <button
                  onClick={handleDisconnect}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-100 text-rose-600 hover:bg-rose-50 text-sm font-bold rounded-lg transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                >
                  <LinkIcon className="w-4 h-4" />
                  Conectar Outlook
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
