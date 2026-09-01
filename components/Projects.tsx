import React, { useState } from 'react';
import { Project, Metric } from '../types';
import StatCard from './StatCard';
import { PlusIcon, EllipsisVerticalIcon, ClockIcon, CheckCircleIcon, XCircleIcon, PauseCircleIcon, XMarkIcon } from './icons/IconComponents';
import { useLocalization } from '../hooks/useLocalization';
import { useFMS } from '../context/FMSContext';
import ProjectDetailModal from './ProjectDetailModal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

const ProjectStatusBadge: React.FC<{ status: Project['status'] }> = ({ status }) => {
  const { t } = useLocalization();
  const baseClasses = 'px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5';
  let specificClasses = '';
  let Icon = null;

  switch (status) {
    case 'In Progress':
      specificClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      Icon = ClockIcon;
      break;
    case 'Completed':
      specificClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      Icon = CheckCircleIcon;
      break;
    case 'On Hold':
        specificClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        Icon = PauseCircleIcon;
        break;
    case 'Cancelled':
      specificClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      Icon = XCircleIcon;
      break;
  }
  
  const statusKey = status.toLowerCase().replace(/ /g, '');

  return (
    <span className={`${baseClasses} ${specificClasses}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {t(statusKey)}
    </span>
  );
};

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
            className="bg-primary-600 h-2.5 rounded-full" 
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);


const Projects: React.FC = () => {
  const { t } = useLocalization();
  const { state, dispatch } = useFMS();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<Omit<Project, 'id' | 'entity'>>({
      name: '',
      customer: '',
      budget: 0,
      spent: 0,
      progress: 0,
      status: 'In Progress',
      profitability: 0,
  });

  const handleSave = () => {
      if (!newProject.name || !newProject.customer) {
          alert('Project Name and Customer are required.');
          return;
      }
      dispatch({ type: 'ADD_PROJECT', payload: { ...newProject, entity: state.activeEntity } });
      setIsModalOpen(false);
      setNewProject({ name: '', customer: '', budget: 0, spent: 0, progress: 0, status: 'In Progress', profitability: 0 });
  };

  const projectMetrics: Metric[] = [
    { title: t('activeProjects'), value: '12', change: '+2', changeType: 'increase' },
    { title: t('totalBudget'), value: 'Rp 5.2B', change: '+8.0%', changeType: 'increase' },
    { title: t('overallProfitability'), value: '28.5%', change: '+1.5%', changeType: 'increase' },
    { title: t('onTimeCompletion'), value: '92%', change: '-3.0%', changeType: 'decrease' },
  ];

  const filteredProjects = state.projects.filter(p => p.entity === state.activeEntity);

  return (
    <div className="container mx-auto">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projectMetrics.map((metric) => (
          <StatCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('projectsOverview')}</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700"
          >
              <PlusIcon className="w-4 h-4 mr-2" />
              {t('newProject')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('projectName')}</th>
                <th scope="col" className="px-6 py-3">{t('budgetVsSpent')}</th>
                <th scope="col" className="px-6 py-3">{t('progress')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('profitability')}</th>
                <th scope="col" className="px-6 py-3 text-center">{t('status')}</th>
                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr 
                  key={project.id} 
                  className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                    <p className="text-xs text-gray-500">{project.customer}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800 dark:text-white">{formatCurrency(project.spent)}</p>
                    <p className="text-xs text-gray-500">{t('of')} {formatCurrency(project.budget)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full mr-2">
                        <ProgressBar progress={project.progress} />
                      </div>
                      <span className="text-xs font-medium text-gray-500">{project.progress}%</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${project.profitability >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {project.profitability.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ProjectStatusBadge status={project.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProject && (
        <ProjectDetailModal 
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <h3 className="text-lg font-bold">{t('newProject')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectName')}</label>
                    <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customer')}</label>
                    <input type="text" value={newProject.customer} onChange={e => setNewProject({...newProject, customer: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')}</label>
                    <select value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value as Project['status']})} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500">
                        <option value="In Progress">{t('inprogress')}</option>
                        <option value="Completed">{t('completed')}</option>
                        <option value="On Hold">{t('onhold')}</option>
                        <option value="Cancelled">{t('cancelled')}</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('budget')}</label>
                    <input type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('spent')}</label>
                    <input type="number" value={newProject.spent} onChange={e => setNewProject({...newProject, spent: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('progress')} (%)</label>
                    <input type="number" value={newProject.progress} min="0" max="100" onChange={e => setNewProject({...newProject, progress: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profitability')} (%)</label>
                    <input type="number" value={newProject.profitability} onChange={e => setNewProject({...newProject, profitability: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
            </div>
            <div className="flex justify-end p-4 border-t dark:border-gray-700">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 mr-2">{t('cancel')}</button>
                <button onClick={handleSave} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700">{t('saveProject')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;