import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Star, Award, BookOpen, Layers } from 'lucide-react';
import axios from 'axios';

interface Competency {
  competencia: string;
  tipo: string;
  nivel_necessario: string;
  descricao: string;
}

interface Role {
  name: string;
  competencies: Competency[];
}

const RolesManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3001/api/roles')
      .then(res => {
        setRoles(res.data);
        if (res.data.length > 0) {
          setSelectedRole(res.data[0]);
        }
      })
      .catch(err => console.error("Failed to load roles", err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.competencies.some(c => c.competencia.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLevelBadge = (level: string) => {
    const clean = level.toLowerCase();
    if (clean.includes('avançado') || clean.includes('avancado') || clean.includes('sênior') || clean.includes('senior')) {
      return 'bg-purple-50 text-purple-600 border-purple-100';
    }
    if (clean.includes('intermediário') || clean.includes('intermediario') || clean.includes('pleno')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cargos e Requisitos</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Consulte as competências exigidas para cada uma das funções cadastradas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left list of roles */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary-600 transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cargo ou competência..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/10 focus:border-primary-600 transition-all shadow-sm font-bold text-xs"
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-md space-y-1 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-gray-400 font-bold">Carregando cargos...</div>
            ) : filteredRoles.length > 0 ? (
              filteredRoles.map((role) => (
                <button
                  key={role.name}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between border ${
                    selectedRole?.name === role.name 
                      ? 'bg-primary-50/50 border-primary-200 text-primary-600 font-extrabold shadow-sm' 
                      : 'border-transparent text-gray-600 hover:bg-gray-50/50 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className={`w-4 h-4 ${selectedRole?.name === role.name ? 'text-primary-600' : 'text-gray-400'}`} />
                    <span className="text-xs truncate">{role.name}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-black">
                    {role.competencies.length}
                  </span>
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-gray-400 font-bold">Nenhum cargo encontrado.</div>
            )}
          </div>
        </div>

        {/* Right detail view of competencies */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-gray-50 pb-5">
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedRole.name}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Matriz de Requisitos Exigidos</p>
                  </div>
                </div>
              </div>

              {/* Competencies Grid */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary-600" />
                    Competências Mapeadas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRole.competencies.map((comp, idx) => (
                      <div key={idx} className="bg-gray-50/30 border border-gray-100 rounded-xl p-4 flex flex-col justify-between hover:border-primary-100 transition-all duration-300">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="font-extrabold text-gray-800 text-xs">{comp.competencia}</span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getLevelBadge(comp.nivel_necessario)}`}>
                              {comp.nivel_necessario}
                            </span>
                          </div>
                          {comp.descricao && (
                            <p className="text-gray-500 text-xs font-medium leading-relaxed mb-3">
                              {comp.descricao}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-auto">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            comp.tipo.toLowerCase().includes('técnica') || comp.tipo.toLowerCase().includes('tecnica')
                              ? 'bg-blue-50/50 text-blue-500 border border-blue-100/50' 
                              : 'bg-emerald-50/50 text-emerald-500 border border-emerald-100/50'
                          }`}>
                            {comp.tipo}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-8 text-center text-gray-400 font-bold py-20">
              Selecione um cargo para ver suas competências.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolesManagement;
