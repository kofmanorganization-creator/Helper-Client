
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  FileText, 
  RefreshCw, 
  TrendingUp, 
  ChevronRight, 
  ShieldCheck, 
  Star, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Smartphone
} from 'lucide-react';
import { helperProService } from '../../services/helperProService';
import { HelperProWorker, HelperProContract } from '../../types';

type AdminSection = 'stats' | 'candidates' | 'certified' | 'contracts';

const HelperProDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('stats');
  const [candidates, setCandidates] = useState<HelperProWorker[]>([]);
  const [certified, setCertified] = useState<HelperProWorker[]>([]);
  const [contracts, setContracts] = useState<HelperProContract[]>([]);
  const [stats, setStats] = useState(helperProService.getStats());

  useEffect(() => {
    const unsub1 = helperProService.subscribeToCandidates(setCandidates);
    const unsub2 = helperProService.subscribeToCertifiedWorkers(setCertified);
    const unsub3 = helperProService.subscribeToContracts(setContracts);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const renderStats = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
          <TrendingUp className="text-primary-400 mb-2" size={24} />
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Revenu Mensuel</p>
          <p className="text-2xl font-black text-white">{stats.monthlyRevenue.toLocaleString()} F</p>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
          <Crown className="text-amber-500 mb-2" size={24} />
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Maids Actives</p>
          <p className="text-2xl font-black text-white">{stats.activeMaids}</p>
        </div>
      </div>
      
      <div className="bg-primary-600 p-6 rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Commission Helper</h3>
          <span className="bg-white/20 px-2 py-1 rounded text-[10px] text-white font-bold">AVG 15%</span>
        </div>
        <p className="text-4xl font-black text-white">{stats.totalCommission.toLocaleString()} F</p>
        <p className="text-primary-100 text-xs mt-2 font-medium opacity-80">Revenu net généré ce mois</p>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 space-y-4">
        <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest px-1">Performance Qualité</h3>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-xl text-green-400"><Star size={20} /></div>
                <div>
                    <p className="text-white font-bold text-sm">Satisfaction</p>
                    <p className="text-xs text-slate-500">Moyenne avis</p>
                </div>
            </div>
            <p className="text-xl font-black text-white">{stats.clientSatisfaction}/5</p>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 rounded-xl text-red-400"><RefreshCw size={20} /></div>
                <div>
                    <p className="text-white font-bold text-sm">Remplacement</p>
                    <p className="text-xs text-slate-500">Taux mensuel</p>
                </div>
            </div>
            <p className="text-xl font-black text-white">{stats.replacementRate}</p>
        </div>
      </div>
    </div>
  );

  const renderCandidates = () => (
    <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center px-1">
            <h2 className="text-white font-black text-xl tracking-tight">Candidates ({candidates.length})</h2>
            <div className="bg-slate-800 px-3 py-1 rounded-full text-[10px] text-slate-500 font-bold uppercase tracking-widest border border-slate-700">Pipeline</div>
        </div>
        
        {candidates.length === 0 ? (
            <div className="py-20 text-center opacity-30 flex flex-col items-center">
                <Users size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Aucune candidate en attente</p>
            </div>
        ) : candidates.map(worker => (
            <div key={worker.id} className="bg-slate-800/40 p-5 rounded-[2rem] border border-slate-700/50 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img src={worker.photoUrl} className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700" alt={worker.firstName} />
                        <div>
                            <h4 className="font-bold text-white">{worker.firstName} {worker.lastName}</h4>
                            <p className="text-xs text-slate-500 flex items-center"><MapPin size={10} className="mr-1" /> {worker.commune}</p>
                        </div>
                    </div>
                    <button className="p-2 text-slate-600"><MoreVertical size={20} /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Moralité</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-amber-500">{worker.scoreMoralite}%</span>
                            <ShieldCheck size={14} className="text-amber-500/50" />
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Psychologie</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-primary-400">{worker.scorePsy}%</span>
                            <Smartphone size={14} className="text-primary-400/50" />
                        </div>
                    </div>
                </div>

                <div className="flex space-x-2 pt-2">
                    <button 
                        onClick={() => helperProService.updateWorkerStatus(worker.id, 'certified')}
                        className="flex-1 py-3 bg-green-600 text-white text-[10px] font-black uppercase rounded-xl tracking-widest active:scale-95 transition-all shadow-lg shadow-green-900/20"
                    >
                        Certifier
                    </button>
                    <button 
                        onClick={() => helperProService.updateWorkerStatus(worker.id, 'rejected')}
                        className="flex-1 py-3 bg-slate-700 text-slate-300 text-[10px] font-black uppercase rounded-xl tracking-widest active:scale-95 transition-all"
                    >
                        Rejeter
                    </button>
                </div>
            </div>
        ))}
    </div>
  );

  const renderContracts = () => (
    <div className="space-y-4 animate-fade-in">
        <h2 className="text-white font-black text-xl tracking-tight px-1">Contrats Familles ({contracts.length})</h2>
        {contracts.map(contract => (
            <div key={contract.id} className="bg-slate-800/40 p-6 rounded-[2.5rem] border border-slate-700/50 space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${contract.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contrat {contract.status}</span>
                        </div>
                        <h4 className="text-xl font-black text-white">{contract.clientName}</h4>
                        <p className="text-xs text-primary-400 font-bold uppercase tracking-widest">{contract.serviceKey.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-white">{contract.monthlyPrice.toLocaleString()} F</p>
                        <p className="text-[10px] text-slate-600 font-black uppercase">Mensualité</p>
                    </div>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-3xl border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                            {contract.workerId ? <CheckCircle2 size={24} /> : <Clock size={24} className="animate-pulse" />}
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Maid Assignée</p>
                            <p className="text-sm font-bold text-white">{contract.workerName || 'Recherche en cours...'}</p>
                        </div>
                    </div>
                    {contract.status === 'active' && (
                        <button 
                            onClick={() => helperProService.triggerReplacement(contract.id)}
                            className="p-2 bg-slate-800 rounded-lg text-amber-500 hover:bg-slate-700 transition-colors"
                        >
                            <RefreshCw size={18} />
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Commission Helper (15%)</p>
                    <p className="text-sm font-black text-green-400">+{ (contract.monthlyPrice * 0.15).toLocaleString() } F</p>
                </div>
            </div>
        ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 p-6 pb-32 space-y-8 animate-fade-in">
      {/* Header Admin */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-primary-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Supervision Pro</p>
          <h1 className="text-3xl font-black text-white tracking-tighter">Helper Admin</h1>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
           <Crown size={24} />
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
        <NavBtn active={activeSection === 'stats'} label="Insights" onClick={() => setActiveSection('stats')} />
        <NavBtn active={activeSection === 'candidates'} label="Pipeline" onClick={() => setActiveSection('candidates')} badge={candidates.length} />
        <NavBtn active={activeSection === 'certified'} label="Helper Maids" onClick={() => setActiveSection('certified')} />
        <NavBtn active={activeSection === 'contracts'} label="Contrats" onClick={() => setActiveSection('contracts')} />
      </div>

      {/* Dynamic Content */}
      <div className="pb-10">
        {activeSection === 'stats' && renderStats()}
        {activeSection === 'candidates' && renderCandidates()}
        {activeSection === 'contracts' && renderContracts()}
        {activeSection === 'certified' && (
             <div className="space-y-4 animate-fade-in">
                 <h2 className="text-white font-black text-xl tracking-tight px-1">Femmes Certifiées ({certified.length})</h2>
                 {certified.map(worker => (
                     <div key={worker.id} className="bg-slate-800/40 p-4 rounded-3xl border border-slate-700/50 flex items-center justify-between">
                         <div className="flex items-center space-x-4">
                            <img src={worker.photoUrl} className="w-12 h-12 rounded-2xl object-cover border-2 border-primary-500/30" alt={worker.firstName} />
                            <div>
                                <h4 className="font-bold text-white">{worker.firstName} {worker.lastName}</h4>
                                <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">Agent Certifié</p>
                            </div>
                         </div>
                         <ChevronRight size={20} className="text-slate-600" />
                     </div>
                 ))}
             </div>
        )}
      </div>

      {/* Floating Action Button (Simulé) */}
      <div className="fixed bottom-24 right-6">
        <button className="w-14 h-14 bg-primary-600 rounded-full shadow-2xl flex items-center justify-center text-white active:scale-90 transition-transform">
           <CheckCircle2 size={24} />
        </button>
      </div>
    </div>
  );
};

const NavBtn = ({ active, label, onClick, badge }: any) => (
    <button 
        onClick={onClick}
        className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border
            ${active ? 'bg-primary-500 border-primary-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}
        `}
    >
        <div className="flex items-center space-x-2">
            <span>{label}</span>
            {badge !== undefined && badge > 0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[8px]">{badge}</span>}
        </div>
    </button>
);

export default HelperProDashboard;
