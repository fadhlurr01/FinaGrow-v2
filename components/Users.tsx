import React, { useState, useMemo, useEffect } from 'react';
import { useFMS } from '../context/FMSContext';
import { useLocalization } from '../hooks/useLocalization';
import { usersApi } from '../services/api';
import { 
  Users as UsersIcon, 
  Plus, 
  Pencil, 
  Trash2, 
  Mail, 
  ShieldCheck, 
  CheckCircle,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  UserPlus,
  UserCheck,
  X,
  RefreshCw
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Accountant' | 'Manager' | 'Viewer' | 'Admin' | 'User';
  subscription: string;
  status?: 'Active' | 'Pending' | 'Suspended' | 'Banned';
}

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Demo Admin', email: 'demo_admin@fms.com', role: 'Admin', subscription: 'Pro Plan', status: 'Active' },
  { id: '2', name: 'Demo User', email: 'demo_user@fms.com', role: 'User', subscription: 'Pro Plan', status: 'Active' }
];

const Users: React.FC = () => {
  const { state, dispatch } = useFMS();
  const { language, t } = useLocalization();

  const [cloudUsers, setCloudUsers] = useState<User[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Fetch live users directly from Aiven Cloud PostgreSQL
  const fetchUsers = async () => {
    setIsLoadingCloud(true);
    try {
      const res = await usersApi.getAll();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCloudUsers(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch cloud users, fallback to local:", err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Load from central cloud repository or context/defaults
  const users: User[] = useMemo(() => {
    if (cloudUsers.length > 0) {
      return cloudUsers;
    }
    try {
      const stored = localStorage.getItem('fms_registered_users');
      if (stored) {
        const list = JSON.parse(stored);
        return list.map((u: any, idx: number) => {
          const emailLower = u.email ? u.email.toLowerCase() : '';
          const isMainAdmin = emailLower === 'mochamadraflyrasyidin@gmail.com';
          const isDemoAdmin = u.isDemo && (u.demoRole === 'Admin' || emailLower === 'demo_admin@fms.com' || emailLower === 'demo@fms.com');
          return {
            id: u.id || `REG_${idx}`,
            name: u.name,
            email: u.email,
            role: isMainAdmin ? 'Admin' : (isDemoAdmin ? 'Admin' : 'User'),
            subscription: isMainAdmin || isDemoAdmin ? 'Pro Plan' : 'Free Plan',
            status: u.status || 'Active'
          } as User;
        });
      }
    } catch (e) {
      console.error("Error reading users in Users.tsx", e);
    }
    return state.users && state.users.length > 0 ? state.users : DEFAULT_USERS;
  }, [cloudUsers, state.users]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active Focus User
  const [focusedUser, setFocusedUser] = useState<User | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Owner' | 'Accountant' | 'Manager' | 'Viewer' | 'Admin' | 'User'>('Accountant');
  const [status, setStatus] = useState<'Active' | 'Pending' | 'Suspended' | 'Banned'>('Active');

  // Stats calculate
  const stats = useMemo(() => {
    const total = users.length;
    let active = 0;
    let pending = 0;
    let owners = 0;
    let accountants = 0;

    users.forEach(u => {
      if (u.status === 'Active' || !u.status) active++;
      if (u.status === 'Pending') pending++;
      if (u.role === 'Owner') owners++;
      if (u.role === 'Accountant') accountants++;
    });

    return {
      total,
      active,
      pending,
      owners,
      accountants
    };
  }, [users]);

  // Filters and Sorters (Admin listed at the top!)
  const filteredUsers = useMemo(() => {
    const list = users.filter(u => {
      const matchesRole = selectedRole === 'all' || u.role === selectedRole;
      const matchesSearch = searchTerm ? (
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      ) : true;
      return matchesRole && matchesSearch;
    });

    // Sort: 'Admin' role first, and then other roles
    return [...list].sort((a, b) => {
      const aIsAdmin = a.role === 'Admin';
      const bIsAdmin = b.role === 'Admin';
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      return 0;
    });
  }, [users, selectedRole, searchTerm]);

  // Handle Create User
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      await usersApi.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        status,
        password: 'password123'
      });
      fetchUsers();
    } catch (err) {
      console.warn("Could not create user in cloud DB:", err);
    }

    const newUser: User = {
      id: Math.random().toString(),
      name,
      email,
      role,
      subscription: 'Pro Plan',
      status
    };

    dispatch({ type: 'ADD_USER', payload: newUser });

    // Sync to fms_registered_users
    try {
      const stored = localStorage.getItem('fms_registered_users');
      if (stored) {
        const usersList = JSON.parse(stored);
        const exists = usersList.some((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (!exists) {
          usersList.push({
            name,
            phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
            email,
            password: '123456',
            isDemo: false,
            demoRole: role,
            status: status
          });
          localStorage.setItem('fms_registered_users', JSON.stringify(usersList));
        }
      }
    } catch (err) {
      console.error("Error adding to fms_registered_users", err);
    }

    setIsAddModalOpen(false);

    // reset
    setName('');
    setEmail('');
    setRole('Accountant');
  };

  // Open Edit Dialog
  const handleOpenEdit = (u: User) => {
    setFocusedUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setStatus(u.status || 'Active');
    setIsEditModalOpen(true);
  };

  // Save Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedUser || !name || !email) return;

    if (focusedUser.role !== 'User' || focusedUser.email === 'demo_admin@fms.com') {
      alert(language === 'id' ? 'Akun sistem terproteksi tidak dapat diubah!' : 'Protected system account cannot be edited!');
      return;
    }

    try {
      await usersApi.update(focusedUser.id, {
        name: name.trim(),
        role,
        status
      });
      fetchUsers();
    } catch (err) {
      console.warn("Could not update user in cloud DB:", err);
    }

    const modified: User = {
      ...focusedUser,
      name,
      email,
      role,
      status
    };

    dispatch({ type: 'EDIT_USER', payload: modified });

    // Sync to fms_registered_users
    try {
      const stored = localStorage.getItem('fms_registered_users');
      if (stored) {
        const usersList = JSON.parse(stored);
        const updatedList = usersList.map((u: any) => {
          if (u.email && u.email.toLowerCase() === email.toLowerCase()) {
            return {
              ...u,
              name,
              demoRole: role,
              status: status,
              isBanned: status === 'Banned'
            };
          }
          return u;
        });
        localStorage.setItem('fms_registered_users', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error("Error updating fms_registered_users", err);
    }

    setIsEditModalOpen(false);
    setFocusedUser(null);
  };

  // Open Delete Overlay
  const handleOpenDelete = (u: User) => {
    setFocusedUser(u);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete User
  const confirmDelete = async () => {
    if (!focusedUser) return;

    if (focusedUser.role !== 'User' || focusedUser.email === 'demo_admin@fms.com') {
      alert(language === 'id' ? 'Akun sistem terproteksi tidak dapat dihapus!' : 'Protected system account cannot be deleted!');
      return;
    }

    try {
      await usersApi.delete(focusedUser.id);
      fetchUsers();
    } catch (err) {
      console.warn("Could not delete user in cloud DB:", err);
    }

    dispatch({ type: 'DELETE_USER', payload: focusedUser.id });

    // Sync deletion
    try {
      const stored = localStorage.getItem('fms_registered_users');
      if (stored) {
        const usersList = JSON.parse(stored);
        const updatedList = usersList.filter((u: any) => u.email?.toLowerCase() !== focusedUser.email?.toLowerCase());
        localStorage.setItem('fms_registered_users', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error("Error deleting from fms_registered_users", err);
    }

    setIsDeleteModalOpen(false);
    setFocusedUser(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white uppercase tracking-tight flex items-center gap-2.5">
            <UsersIcon className="w-7 h-7 text-primary-600 dark:text-primary-450" />
            <span>{language === 'id' ? 'Kolaborasi Tim & Anggota' : 'Users & Permissions'}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {language === 'id' ? 'Kelola tingkat akses masuk, undang kolaborator, dan definisikan peran otorisasi keuangan.' : 'Provision system seats, invite auditors, and distribute financial access rights.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoadingCloud}
            title={language === 'id' ? 'Sinkronisasi Data Cloud Aiven' : 'Sync Cloud Data'}
            className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-3 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-primary-500 ${isLoadingCloud ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{language === 'id' ? 'Sync Cloud' : 'Sync Cloud'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setName('');
              setEmail('');
              setRole('Accountant');
              setIsAddModalOpen(true);
            }}
            className="whitespace-nowrap flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>{language === 'id' ? 'Undang Anggota' : 'Invite Member'}</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest block mb-1">
            {language === 'id' ? 'TOTAL KURSI TIM' : 'PROVISIONED SEATS'}
          </span>
          <h3 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
            {stats.total} / 5
          </h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-2">
            {language === 'id' ? 'Kuota Tim Pro Plan aktif' : 'Active users quota of Pro Plan'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest block mb-1">
            {language === 'id' ? 'ANGGOTA AKTIF' : 'ACTIVE USERS'}
          </span>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-450 tracking-tight">
            {stats.active}
          </h3>
          <p className="text-[10.5px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <UserCheck className="w-4 h-4" />
            <span>{language === 'id' ? 'Aktif dalam 30 hari' : 'Online within 30 days'}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest block mb-1">
            {language === 'id' ? 'UNDANGAN TERKIRIM' : 'PENDING INVITES'}
          </span>
          <h3 className="text-2xl font-black text-amber-500 tracking-tight">
            {stats.pending}
          </h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-555 mt-2 flex items-center gap-1">
            <UserPlus className="w-4 h-4 text-amber-500" />
            <span>{language === 'id' ? 'Menunggu persetujuan email' : 'Waiting for email acceptance'}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest block mb-1">
            {language === 'id' ? 'ROLE OTORITAS UTAMA' : 'PRIMARY ACCOUNTANTS'}
          </span>
          <h3 className="text-2xl font-black text-indigo-650 dark:text-indigo-400 tracking-tight">
            {stats.accountants}
          </h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-2">
            {language === 'id' ? 'Staf pembukuan profesional' : 'Authorized financial bookkeepers'}
          </p>
        </div>
      </div>

      {/* 3. COLLABORATION USERS TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm">
        <div className="p-5 flex flex-col md:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700/50 gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">
              {language === 'id' ? 'Karyawan & Hak Akses' : 'Team Directory & Security Permissions'}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
              {language === 'id' ? 'Tinjau siapa saja yang memiliki kewenangan membaca, menulis, atau mengaudit buku besar.' : 'Audit user authorization layers (Owner, Accountant, Manager, and Read-Only Auditors).'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <input 
              type="text" 
              placeholder={language === 'id' ? 'Cari anggota...' : 'Search members name/email...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-450"
            />

            {/* Filter select */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-primary-300"
            >
              <option value="all">{language === 'id' ? 'Semua Otoritas' : 'All Roles'}</option>
              <option value="Owner">Owner</option>
              <option value="Accountant">Accountant</option>
              <option value="Manager">Manager</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
        </div>

        {/* Users list */}
        <div className="hidden md:block overflow-x-auto font-sans">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-405 dark:text-slate-400 font-black uppercase tracking-widest border-b border-slate-105 dark:border-slate-700/50">
              <tr>
                <th className="px-6 py-4">{language === 'id' ? 'Nama Pengguna' : 'User Member'}</th>
                <th className="px-6 py-4">{language === 'id' ? 'Kontak Email' : 'Email Address'}</th>
                <th className="px-6 py-4">{language === 'id' ? 'Tingkat Otoritas (Role)' : 'Role / Scope'}</th>
                <th className="px-6 py-4">{language === 'id' ? 'Paket Lisensi' : 'Capacity'}</th>
                <th className="px-6 py-4 text-center">{language === 'id' ? 'Status Keaktifan' : 'Active Status'}</th>
                <th className="px-6 py-4 text-center">{language === 'id' ? 'Kewenangan (Aksi)' : 'Manage'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-slate-700 dark:text-slate-300">
              {filteredUsers.map((user) => {
                const userStatus = user.status || 'Active';
                const firstLetter = user.name ? user.name[0].toUpperCase() : 'U';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-primary-650 text-white font-black text-xs flex items-center justify-center shadow-inner">
                          {firstLetter}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-855 dark:text-slate-100">{user.name}</div>
                          <span className="text-[10px] text-slate-455 dark:text-slate-555 uppercase tracking-wider font-semibold">Seat ID: {user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-550 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.role === 'Owner' || user.role === 'Admin'
                           ? 'bg-purple-105 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                           : user.role === 'Accountant'
                           ? 'bg-indigo-105 text-slate-800 dark:bg-indigo-900/40 dark:text-indigo-300'
                           : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        <span>{user.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-550 dark:text-slate-400 font-bold">{user.subscription || 'Pro Plan'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        userStatus === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-990/20 dark:text-emerald-300'
                          : userStatus === 'Pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-990/20 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-805 dark:bg-rose-990/20 dark:text-rose-350'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${userStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-405'} inline-block`}></span>
                        <span>{userStatus === 'Active' ? (language === 'id' ? 'Aktif' : 'Active') : userStatus}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.role !== 'User' || user.email === 'demo_admin@fms.com' ? (
                        <span className="text-[10px] text-slate-400 dark:text-slate-555 font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded">
                          {language === 'id' ? 'Terkunci (System)' : 'Locked (System)'}
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            title={language === 'id' ? 'Ubah Otoritas' : 'Update seats'}
                            className="p-1 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-bold transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 inline-block" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(user)}
                            title={language === 'id' ? 'Keluarkan Tim' : 'Revoke'}
                            className="p-1 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-505 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-455 rounded font-bold transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline-block" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                    {language === 'id' ? 'Kolaborator tidak terdeteksi.' : 'No team members match parameters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Deck */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">
              {language === 'id' ? 'Kolaborator tidak terdeteksi.' : 'No team members match parameters.'}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const userStatus = user.status || 'Active';
              const firstLetter = user.name ? user.name[0].toUpperCase() : 'U';

              return (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-primary-650 text-white font-black text-xs flex items-center justify-center shadow-inner shrink-0">
                        {firstLetter}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-855 dark:text-slate-100 text-xs sm:text-sm leading-snug">{user.name}</h4>
                        <span className="text-[9px] text-slate-400 dark:text-slate-505 block tracking-wider uppercase font-semibold">Seat ID: {user.id}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {user.role !== 'User' || user.email === 'demo_admin@fms.com' ? (
                        <span className="text-[8px] sm:text-[9.5px] text-slate-400 dark:text-slate-503 font-bold bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-1.5 py-0.5 rounded">
                          {language === 'id' ? 'Terkunci' : 'Locked'}
                        </span>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            title={language === 'id' ? 'Ubah Otoritas' : 'Update seats'}
                            className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-300 rounded font-bold cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(user)}
                            title={language === 'id' ? 'Keluarkan Tim' : 'Revoke'}
                            className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-503 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-455 rounded font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded-xl text-[10px] sm:text-[11px] leading-relaxed">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">{language === 'id' ? 'Kontak Email' : 'Email Address'}</span>
                      <span className="font-semibold text-slate-655 dark:text-slate-300 block truncate max-w-[130px]">{user.email}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">{language === 'id' ? 'Tingkat Otoritas' : 'Authority Role'}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded-full text-[8.5px] font-bold ${
                        user.role === 'Owner' || user.role === 'Admin'
                           ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-305'
                           : user.role === 'Accountant'
                           ? 'bg-indigo-100 text-indigo-805 dark:bg-indigo-900/40 dark:text-indigo-305'
                           : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>{user.role}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-455 uppercase tracking-widest">{language === 'id' ? 'Paket Lisensi' : 'Capacity'}</span>
                      <span className="bg-slate-100 dark:bg-slate-705 text-[8.5px] text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded scale-90">{user.subscription || 'Pro Plan'}</span>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase ${
                      userStatus === 'Active'
                         ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-990/20 dark:text-emerald-305'
                         : userStatus === 'Pending'
                         ? 'bg-amber-100 text-amber-805 dark:bg-amber-990/20 dark:text-amber-305'
                         : 'bg-rose-105 text-rose-805 dark:bg-rose-990/20 dark:text-rose-350'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${userStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-405'} inline-block`}></span>
                      <span>{userStatus === 'Active' ? (language === 'id' ? 'Aktif' : 'Active') : userStatus}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. INVITE TEAM SEAT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-905/65 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-705 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-slate-800 dark:text-white animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span>{language === 'id' ? 'Undang Anggota Kooperasi' : 'Invite Team Seat'}</span>
              </h3>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-slate-800 dark:text-slate-100">
              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">{language === 'id' ? 'NAMA LENGKAP' : 'FULL NAME'}</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Richard Hendricks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">{language === 'id' ? 'ALAMAT EMAIL RESMI' : 'OFFICIAL EMAIL'}</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">{language === 'id' ? 'Role / Otoritas' : 'Authority Role'}</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="Owner">{language === 'id' ? 'Owner (Pemilik Toko)' : 'Owner (Primary)'}</option>
                    <option value="Accountant">{language === 'id' ? 'Accountant (Akuntan)' : 'Accountant'}</option>
                    <option value="Manager">Manager</option>
                    <option value="Viewer">{language === 'id' ? 'Viewer (Auditor Luar)' : 'Viewer (Auditor)'}</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">{language === 'id' ? 'STATUS AWAL' : 'INITIAL STATUS'}</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="Active">{language === 'id' ? 'Aktif (Instan)' : 'Active Seat (Instant)'}</option>
                    <option value="Pending">{language === 'id' ? 'Undangan Tertunda' : 'Pending Invite'}</option>
                    <option value="Suspended">{language === 'id' ? 'Suspended' : 'Suspended'}</option>
                    <option value="Banned">{language === 'id' ? 'Banned' : 'Banned'}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-655 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-205 cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-750 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'id' ? 'Tembak Undangan' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODIFY TEAM SEAT MODAL */}
      {isEditModalOpen && focusedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-905/65 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-705 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-slate-800 dark:text-white animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-base font-black uppercase tracking-wider">
                {language === 'id' ? 'Sesuaikan Otorisasi Seat' : 'Edit Seat Authorization'}
              </h3>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-slate-850 dark:text-slate-100">
              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">User Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Contact Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Authority Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Manager">Manager</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Status Check</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending Invite</option>
                    <option value="Suspended">Suspended (Non-aktif)</option>
                    <option value="Banned">Banned</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-655 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-205 cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'id' ? 'Perbarui Hak' : 'Save Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. REVOKE/DELETE CONFIRMATION ACTION POPUP */}
      {isDeleteModalOpen && focusedUser && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-910/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-center text-slate-800 dark:text-white animate-in zoom-in-95 duration-250">
            
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-955/20 rounded-full flex items-center justify-center text-rose-550 mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black tracking-tight leading-snug">
              {language === 'id' ? 'Keluarkan Anggota Tim?' : 'Revoke Seat Authorization?'}
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed text-slate-500 dark:text-slate-400">
              {language === 'id' 
                ? `Apakah anda yakin ingin mencabut seluruh hak izin masuk sistem untuk ${focusedUser.name} (${focusedUser.email})? Izin audit dan akuntansi akan diputus seketika.`
                : `Are you sure you want to revoke system privileges for ${focusedUser.name} (${focusedUser.email})? Safe login keys will be revoked.`}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {language === 'id' ? 'Batal' : 'No, Keep'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {language === 'id' ? 'Ya, Cabut' : 'Yes, Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
