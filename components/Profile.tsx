import React, { useState } from 'react';
import { useFMS } from '../context/FMSContext';
import { useLocalization } from '../hooks/useLocalization';
import { User, Mail, Phone, Shield, Gem, Save, CheckCircle, Eye, EyeOff } from 'lucide-react';

const Profile: React.FC = () => {
  const { state, dispatch } = useFMS();
  const { language, t } = useLocalization();

  // Find active user from state or fallback
  const fallbackUser = {
    name: state.role === 'User' ? 'Demo User' : 'Andi Wijaya',
    email: state.currentUserEmail || 'demo_admin@fms.com',
    phone: '08123456789',
    role: state.role,
    subscription: state.subscription ? `${state.subscription} Plan` : 'Pro Plan'
  };

  const activeUserFromState = state.users?.find((u: any) => u.email === state.currentUserEmail);
  const activeUser = activeUserFromState || fallbackUser;

  const [name, setName] = useState(activeUser.name);
  const [phone, setPhone] = useState(activeUser.phone || '08123456789');
  const [successMsg, setSuccessMsg] = useState('');

  const emailKey = state.currentUserEmail || 'demo_admin@fms.com';
  
  // State for avatar image
  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem(`fms_avatar_${emailKey}`) || '';
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSuccessMsg(language === 'id' ? 'File terlalu besar! Maksimal ukuran adalah 2MB.' : 'File too large! Max allowed size is 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        localStorage.setItem(`fms_avatar_${emailKey}`, base64String);
        setSuccessMsg(language === 'id' ? 'Foto profil berhasil diperbarui!' : 'Profile picture updated successfully!');
        
        // Trigger a global state change to broadcast the avatar refresh instantly to Header
        dispatch({
          type: 'SET_STATE',
          payload: {
            ...state,
            avatarUpdatedAt: Date.now()
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };
  const storedProfileFields = (() => {
    try {
      const stored = localStorage.getItem(`fms_profile_fields_${emailKey}`);
      return stored ? JSON.parse(stored) : {
        department: 'Finance & Treasury',
        jobTitle: state.role === 'Admin' ? 'Senior Financial Controller' : 'Associate Analyst',
        costCenter: 'CC-ID-JAB-204',
        employeeId: 'EMP-98839211'
      };
    } catch (_) {
      return {
        department: 'Finance & Treasury',
        jobTitle: state.role === 'Admin' ? 'Senior Financial Controller' : 'Associate Analyst',
        costCenter: 'CC-ID-JAB-204',
        employeeId: 'EMP-98839211'
      };
    }
  })();

  const [department, setDepartment] = useState(storedProfileFields.department);
  const [jobTitle, setJobTitle] = useState(storedProfileFields.jobTitle);
  const [costCenter, setCostCenter] = useState(storedProfileFields.costCenter);
  const [employeeId, setEmployeeId] = useState(storedProfileFields.employeeId);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');

  // Eye hides/shows
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPassErrorMsg(language === 'id' ? 'Silakan isi semua kolom kata sandi!' : 'Please fill in all password fields!');
      return;
    }

    if (newPassword.length < 6) {
      setPassErrorMsg(language === 'id' ? 'Kata sandi baru minimal harus 6 karakter!' : 'New password must be at least 6 characters!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPassErrorMsg(language === 'id' ? 'Konfirmasi kata sandi baru tidak cocok!' : 'Confirm new password does not match!');
      return;
    }

    try {
      const stored = localStorage.getItem('fms_registered_users');
      if (stored) {
        const usersList = JSON.parse(stored);
        const activeUserIdx = usersList.findIndex((u: any) => u.email && u.email.toLowerCase() === emailKey.toLowerCase());
        
        if (activeUserIdx === -1) {
          setPassErrorMsg(language === 'id' ? 'Pengguna tidak ditemukan dalam sistem!' : 'User not found in system!');
          return;
        }

        const userObj = usersList[activeUserIdx];
        if (userObj.password !== currentPassword) {
          setPassErrorMsg(language === 'id' ? 'Kata sandi lama Anda salah!' : 'Your current old password is incorrect!');
          return;
        }

        // update
        userObj.password = newPassword;
        usersList[activeUserIdx] = userObj;
        localStorage.setItem('fms_registered_users', JSON.stringify(usersList));

        // success!
        setPassSuccessMsg(language === 'id' ? 'Kata sandi Anda berhasil diperbarui!' : 'Your password has been successfully updated!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPassErrorMsg(language === 'id' ? 'Sistem database pengguna tidak siap!' : 'User database is not initialized!');
      }
    } catch (err) {
      console.error(err);
      setPassErrorMsg(language === 'id' ? 'Terjadi kesalahan sistem!' : 'A system error occurred!');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update in the state.users list
    const updatedUsers = (state.users || []).map((u: any) => {
      if (u.email === state.currentUserEmail) {
        return { ...u, name, phone };
      }
      return u;
    });

    // 2. Sync to fms_registered_users list in localStorage
    try {
      const stored = localStorage.getItem('fms_registered_users');
      if (stored) {
        const usersList = JSON.parse(stored);
        const updatedList = usersList.map((u: any) => {
          if (u.email && u.email.toLowerCase() === (state.currentUserEmail || '').toLowerCase()) {
            return {
              ...u,
              name,
              phone
            };
          }
          return u;
        });
        localStorage.setItem('fms_registered_users', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error("Error updating registered users list", err);
    }

    // Direct write to user specific state storage
    const targetStateData = {
      ...state,
      users: updatedUsers
    };
    
    dispatch({
      type: 'SET_STATE',
      payload: targetStateData
    });

    setSuccessMsg(language === 'id' ? 'Profil Anda berhasil diperbarui!' : 'Your profile has been successfully updated!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {language === 'id' ? 'Profil Saya' : 'My Profile'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {language === 'id' ? 'Kelola detail informasi pribadi dan otoritas akun Anda' : 'Manage your personal profile details and account authority'}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-600 dark:text-emerald-300 animate-slideUp">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Summary & Membership Info */}
        <div className="bg-white dark:bg-slate-800/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm flex flex-col items-center text-center space-y-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-white dark:border-slate-800 flex items-center justify-center bg-gradient-to-tr from-primary-500 to-indigo-600">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-3xl font-black">{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 p-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 cursor-pointer transition-all flex items-center justify-center">
              <span className="text-xs" title={language === 'id' ? 'Unggah Foto' : 'Upload Photo'}>📸</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload} 
              />
            </label>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 dark:text-white text-base">{name}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500">{state.currentUserEmail}</p>
          </div>

          <div className="w-full border-t border-slate-100 dark:border-slate-750 pt-5 space-y-4 text-left">
            {/* Role indicator */}
            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100/30 dark:border-slate-800/20">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-semibold">
                <Shield className="w-4 h-4 text-primary-500" />
                <span>{language === 'id' ? 'Hak Akses' : 'Access Role'}</span>
              </div>
              <span className="font-extrabold uppercase text-slate-800 dark:text-slate-200">{state.role || activeUser.role}</span>
            </div>

            {/* Plan indicator */}
            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100/30 dark:border-slate-800/20">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-semibold">
                <Gem className="w-4 h-4 text-emerald-500" />
                <span>{language === 'id' ? 'Paket Layanan' : 'Subscription'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-990/20 dark:text-emerald-300">
                {state.subscription === 'Pro' ? 'Pro Plan' : 'Free Suite'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Main Edit Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal & Corporate Details */}
          <div className="bg-white dark:bg-slate-800/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6 pl-1 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-primary-500" />
              <span>{language === 'id' ? 'Informasi Personal & Penugasan' : 'Personal & Corporate Details'}</span>
            </h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              // Save 4 additional custom fields
              try {
                localStorage.setItem(`fms_profile_fields_${state.currentUserEmail || 'demo_admin@fms.com'}`, JSON.stringify({
                  department,
                  jobTitle,
                  costCenter,
                  employeeId
                }));
              } catch (_) {}

              handleSaveProfile(e);
            }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    {language === 'id' ? 'Nama Lengkap' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-550 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-emerald-400 dark:focus:border-emerald-400 transition-all font-semibold text-sm"
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    {language === 'id' ? 'Nomor Telepon' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-550 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-emerald-400 dark:focus:border-emerald-400 transition-all font-semibold text-sm"
                    />
                  </div>
                </div>

                {/* 1. Department / Divisi */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    {language === 'id' ? 'Departemen / Divisi' : 'Department / Division'}
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Finance & Control"
                    className="w-full px-4 py-3 border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-emerald-400 transition-all font-semibold text-sm"
                  />
                </div>

                {/* 2. Job Title */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    {language === 'id' ? 'Jabatan Pekerjaan' : 'Job Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Accounting Supervisor"
                    className="w-full px-4 py-3 border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-emerald-400 transition-all font-semibold text-sm"
                  />
                </div>

                {/* 3. Cost Center Code */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    {language === 'id' ? 'Kode Pusat Biaya (Cost Center)' : 'Cost Center Code'}
                  </label>
                  <input
                    type="text"
                    required
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    placeholder="e.g. CC-CORP-JKT-10"
                    className="w-full px-4 py-3 border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-emerald-400 transition-all font-semibold text-sm"
                  />
                </div>

                {/* 4. Employee ID / NIP */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    {language === 'id' ? 'ID Karyawan / NIP / NPWP' : 'Employee ID / Staff Number'}
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-2024-00892"
                    className="w-full px-4 py-3 border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-emerald-400 transition-all font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Email Address Input (Disabled / Readonly) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  {language === 'id' ? 'Alamat Email (Akun Utama)' : 'Email Address (Primary Account)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={state.currentUserEmail || 'demo_admin@fms.com'}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 font-semibold text-sm text-slate-400 cursor-not-allowed opacity-80 rounded-2xl"
                  />
                </div>
                <p className="text-[10px] text-slate-400 pl-1 mt-1 font-medium">
                  {language === 'id' ? 'Alamat email didaftarkan sebagai kunci login unik sistem dan tidak dapat diubah.' : 'The email address serves as your unique system login key and cannot be changed.'}
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-2xl transition hover:shadow active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>{language === 'id' ? 'Simpan Perubahan' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Secure Change Password System */}
          <div className="bg-white dark:bg-slate-800/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
            <h3 className="text-sm font-black text-red-655 dark:text-red-400 uppercase tracking-wider mb-2 pl-1 flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span>{language === 'id' ? 'Ganti Kata Sandi Keamanan' : 'Change Security Password'}</span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 mb-5 pl-1 leading-relaxed">
              {language === 'id' 
                ? 'Amankan ledger keuangan Anda dengan memperbarui otentikasi kata sandi. Isian harus urut sesuai petunjuk di bawah ini.' 
                : 'Keep your financial ledger secure by updating your authentication password. Sequence must be precisely entered as follows.'}
            </p>

            {passErrorMsg && (
              <div className="p-3.5 mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-800 text-xs font-bold text-rose-600 dark:text-rose-400 rounded-xl leading-relaxed">
                ⚠️ {passErrorMsg}
              </div>
            )}
            
            {passSuccessMsg && (
              <div className="p-3.5 mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-xl leading-relaxed">
                ✓ {passSuccessMsg}
              </div>
            )}
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* 1. Input Password Lama */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  {language === 'id' ? '1. Masukkan Password Lama' : '1. Enter Current Old Password'}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-12 py-3 border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm leading-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2. Input Password Baru */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  {language === 'id' ? '2. Masukkan Password Baru' : '2. Enter New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="•••••••• (min. 6 characters)"
                    className="w-full pl-4 pr-12 py-3 border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm leading-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3. Konfirmasi Password Baru */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  {language === 'id' ? '3. Konfirmasi Password Baru' : '3. Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-12 py-3 border border-slate-205 dark:border-slate-705 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm leading-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-2xl transition hover:shadow active:scale-98"
                >
                  🔒 <span>{language === 'id' ? 'Perbarui Kata Sandi' : 'Apply New Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
