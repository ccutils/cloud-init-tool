import React, { useState } from 'react';
import { generateISO } from './api/client';
import { 
  Download, Plus, Trash2, Server, User as UserIcon, 
  Network, Key, Globe, Shield, Activity, RefreshCw, Clock, Languages
} from 'lucide-react';

const i18n: Record<string, any> = {
  en: {
    title: "Cloud-Init Seed Generator",
    subtitle: "Professional NoCloud ISO generation for Ubuntu 24.04 and AlmaLinux 9.",
    system_basics: "System Basics",
    hostname: "Hostname",
    instance_id: "Instance ID",
    allow_ssh_pw: "Allow Global SSH Password Authentication",
    user_accounts: "User Accounts",
    username: "Username",
    password: "Password",
    ssh_keys: "SSH Authorized Keys",
    add_ssh_key: "Add SSH Key",
    root_config: "Root User Configuration",
    enable_root: "Enable Root Management",
    root_password: "Root Password",
    allow_root_ssh_pw: "Allow SSH Password Login",
    root_ssh_keys: "Root SSH Authorized Keys",
    add_root_ssh_key: "Add Root SSH Key",
    regional_settings: "Regional Settings",
    region: "Region",
    city_timezone: "City / Timezone",
    select_region: "-- Select Region --",
    select_city: "-- Select City --",
    selected_timezone: "Selected Timezone",
    network_interfaces: "Network Interfaces",
    dhcp_v4: "DHCP v4",
    ipv4_address: "IPv4 Address (CIDR)",
    gateway: "Gateway",
    dns_servers: "DNS Servers",
    dns_hint: "Separate multiple IPs with commas.",
    generate_btn: "GENERATE ISO IMAGE",
    processing: "Processing...",
    footer: "Built for VMware, Hyper-V, and NoCloud compatible environments.",
    error_gen: "Error generating ISO",
    random_uuid: "Generate random UUID"
  },
  zh: {
    title: "Cloud-Init 配置生成器",
    subtitle: "为 Ubuntu 22.04+ 及 RHEL/AlmaLinux/Rocky Linux 8+ 提供专业的 NoCloud ISO 生成。",
    system_basics: "系统基础配置",
    hostname: "主机名",
    instance_id: "实例 ID",
    allow_ssh_pw: "允许全局 SSH 密码认证",
    user_accounts: "普通用户管理",
    username: "用户名",
    password: "密码",
    ssh_keys: "SSH 授权公钥",
    add_ssh_key: "添加 SSH 公钥",
    root_config: "Root 用户配置",
    enable_root: "启用 Root 用户管理",
    root_password: "Root 密码",
    allow_root_ssh_pw: "允许 SSH 密码登录",
    root_ssh_keys: "Root SSH 授权公钥",
    add_root_ssh_key: "添加 Root SSH 公钥",
    regional_settings: "区域设置",
    region: "大区",
    city_timezone: "城市 / 时区",
    select_region: "-- 选择大区 --",
    select_city: "-- 选择城市 --",
    selected_timezone: "当前选择时区",
    network_interfaces: "网络接口配置",
    dhcp_v4: "DHCP v4",
    ipv4_address: "IPv4 地址 (CIDR)",
    gateway: "网关",
    dns_servers: "DNS 服务器",
    dns_hint: "多个 IP 请使用逗号分隔。",
    generate_btn: "生成 ISO 镜像",
    processing: "正在生成...",
    footer: "专为 VMware, Hyper-V 及 NoCloud 兼容环境构建。",
    error_gen: "生成 ISO 失败",
    random_uuid: "生成随机 UUID"
  }
};

const TIMEZONE_DATA: Record<string, string[]> = {
  "Africa": ["Abidjan", "Accra", "Addis_Ababa", "Algiers", "Cairo", "Casablanca", "Johannesburg", "Lagos", "Nairobi", "Tunis"],
  "America": ["Anchorage", "Argentina/Buenos_Aires", "Bogota", "Chicago", "Denver", "Halifax", "Los_Angeles", "Mexico_City", "New_York", "Phoenix", "Sao_Paulo", "Toronto", "Vancouver"],
  "Asia": ["Almaty", "Bangkok", "Dubai", "Hong_Kong", "Jakarta", "Jerusalem", "Kabul", "Karachi", "Kolkata", "Manila", "Seoul", "Shanghai", "Singapore", "Taipei", "Tashkent", "Tehran", "Tokyo", "Ulaanbaatar"],
  "Atlantic": ["Azores", "Bermuda", "Canary", "Cape_Verde"],
  "Australia": ["Adelaide", "Brisbane", "Darwin", "Melbourne", "Perth", "Sydney"],
  "Europe": ["Amsterdam", "Athens", "Belgrade", "Berlin", "Brussels", "Bucharest", "Budapest", "Copenhagen", "Dublin", "Helsinki", "Istanbul", "Lisbon", "London", "Madrid", "Moscow", "Oslo", "Paris", "Prague", "Rome", "Stockholm", "Vienna", "Warsaw", "Zurich"],
  "Indian": ["Chagos", "Christmas", "Cocos", "Maldives", "Mauritius"],
  "Pacific": ["Auckland", "Chatham", "Easter", "Fiji", "Guadalcanal", "Honolulu", "Majuro", "Noumea", "Pago_Pago", "Port_Moresby", "Tahiti", "Tongatapu"]
};

function App() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('app-lang');
    if (saved) return saved;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  });

  const t = (key: string) => i18n[lang][key] || key;

  const toggleLang = () => {
    const next = lang === 'en' ? 'zh' : 'en';
    setLang(next);
    localStorage.setItem('app-lang', next);
  };

  const [config, setConfig] = useState({
    instance_id: 'iid-local01',
    hostname: 'ubuntu-24-04',
    ssh_pwauth: false,
    timezone: '',
    root_enabled: false,
    root_password: '',
    root_ssh_keys: [] as string[],
    root_ssh_pwauth: false,
    users: [
      { name: 'ubuntu', password: 'password', ssh_authorized_keys: [] as string[] }
    ],
    interfaces: [
      { 
        name: 'eth0', 
        dhcp4: true, 
        addresses: [] as string[], 
        gateway4: '', 
        nameservers: [] as string[] 
      }
    ]
  });

  const [loading, setLoading] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState(() => {
    if (config.timezone && config.timezone.includes('/')) {
      return config.timezone.split('/')[0];
    }
    return '';
  });

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    if (!region) {
      setConfig({ ...config, timezone: '' });
    }
  };

  const handleCityChange = (city: string) => {
    if (selectedRegion && city) {
      setConfig({ ...config, timezone: `${selectedRegion}/${city}` });
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const blob = await generateISO(config);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `seed-${config.instance_id}.iso`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      alert(t('error_gen'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addSshKey = (userIdx: number) => {
    const newUsers = [...config.users];
    newUsers[userIdx].ssh_authorized_keys.push('');
    setConfig({ ...config, users: newUsers });
  };

  const updateSshKey = (userIdx: number, keyIdx: number, value: string) => {
    const newUsers = [...config.users];
    newUsers[userIdx].ssh_authorized_keys[keyIdx] = value;
    setConfig({ ...config, users: newUsers });
  };

  const removeSshKey = (userIdx: number, keyIdx: number) => {
    const newUsers = [...config.users];
    newUsers[userIdx].ssh_authorized_keys.splice(keyIdx, 1);
    setConfig({ ...config, users: newUsers });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center relative">
          <div className="absolute right-0 top-0">
            <button 
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Languages size={16} />
              {lang === 'en' ? '简体中文' : 'English'}
            </button>
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl mb-6">
            <Shield className="text-white fill-blue-600" size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{t('title')}</h1>
          <p className="text-lg text-slate-600 mt-3 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </header>

        <div className="space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex flex-row items-center whitespace-nowrap">
                <Server className="text-blue-600 mr-3 flex-shrink-0" size={22} />
                <h2 className="text-lg font-bold text-slate-800">{t('system_basics')}</h2>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('hostname')}</label>
                <input 
                  type="text" 
                  value={config.hostname}
                  onChange={e => setConfig({...config, hostname: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="e.g. web-server-01"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('instance_id')}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={config.instance_id}
                    onChange={e => setConfig({...config, instance_id: e.target.value})}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  />
                  <button 
                    onClick={() => setConfig({...config, instance_id: crypto.randomUUID()})}
                    title={t('random_uuid')}
                    className="p-2 text-blue-600 hover:bg-blue-50 border border-slate-300 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex items-center">
                  <Shield className="text-blue-600 mr-2" size={20} />
                  <span className="font-bold text-blue-900">{t('allow_ssh_pw')}</span>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={config.ssh_pwauth}
                      onChange={e => setConfig({...config, ssh_pwauth: e.target.checked})}
                    />
                    <div className={`block w-12 h-6 rounded-full transition-colors ${config.ssh_pwauth ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.ssh_pwauth ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex flex-row items-center whitespace-nowrap">
                <UserIcon className="text-emerald-600 mr-3 flex-shrink-0" size={22} />
                <h2 className="text-lg font-bold text-slate-800">{t('user_accounts')}</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {config.users.map((user, uIdx) => (
                <div key={uIdx} className="p-5 border border-slate-100 bg-slate-50/50 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{t('username')}</label>
                      <input 
                        type="text" 
                        value={user.name}
                        onChange={e => {
                          const newUsers = [...config.users];
                          newUsers[uIdx].name = e.target.value;
                          setConfig({...config, users: newUsers});
                        }}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{t('password')}</label>
                      <input 
                        type="password" 
                        value={user.password || ''}
                        onChange={e => {
                          const newUsers = [...config.users];
                          newUsers[uIdx].password = e.target.value;
                          setConfig({...config, users: newUsers});
                        }}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <Key size={16} className="mr-1" /> {t('ssh_keys')}
                    </label>
                    <div className="space-y-2">
                      {user.ssh_authorized_keys.map((key, kIdx) => (
                        <div key={kIdx} className="flex gap-2">
                          <input 
                            type="text"
                            value={key}
                            onChange={e => updateSshKey(uIdx, kIdx, e.target.value)}
                            placeholder="ssh-rsa AAAAB3Nza..."
                            className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono outline-none"
                          />
                          <button 
                            onClick={() => removeSshKey(uIdx, kIdx)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => addSshKey(uIdx)}
                        className="text-sm text-emerald-600 font-bold flex items-center hover:text-emerald-700 transition-colors mt-2"
                      >
                        <Plus size={16} className="mr-1" /> {t('add_ssh_key')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex flex-row items-center whitespace-nowrap">
                <Shield className="text-rose-600 mr-3 flex-shrink-0" size={22} />
                <h2 className="text-lg font-bold text-slate-800">{t('root_config')}</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                <div className="flex items-center">
                  <UserIcon className="text-rose-600 mr-2" size={20} />
                  <span className="font-bold text-rose-900">{t('enable_root')}</span>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={config.root_enabled}
                      onChange={e => setConfig({...config, root_enabled: e.target.checked})}
                    />
                    <div className={`block w-12 h-6 rounded-full transition-colors ${config.root_enabled ? 'bg-rose-600' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.root_enabled ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              {config.root_enabled && (
                <div className="space-y-6 p-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{t('root_password')}</label>
                      <input 
                        type="password" 
                        value={config.root_password}
                        onChange={e => setConfig({...config, root_password: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        placeholder="Set root password"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6 px-2">
                      <span className="text-sm font-semibold text-slate-700">{t('allow_root_ssh_pw')}</span>
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only"
                            checked={config.root_ssh_pwauth}
                            onChange={e => setConfig({...config, root_ssh_pwauth: e.target.checked})}
                          />
                          <div className={`block w-10 h-5 rounded-full transition-colors ${config.root_ssh_pwauth ? 'bg-rose-500' : 'bg-slate-200'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${config.root_ssh_pwauth ? 'translate-x-5' : ''}`}></div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <Key size={16} className="mr-1" /> {t('root_ssh_keys')}
                    </label>
                    <div className="space-y-2">
                      {config.root_ssh_keys.map((key, kIdx) => (
                        <div key={kIdx} className="flex gap-2">
                          <input 
                            type="text"
                            value={key}
                            onChange={e => {
                              const newKeys = [...config.root_ssh_keys];
                              newKeys[kIdx] = e.target.value;
                              setConfig({...config, root_ssh_keys: newKeys});
                            }}
                            placeholder="ssh-rsa AAAAB3Nza..."
                            className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono outline-none"
                          />
                          <button 
                            onClick={() => {
                              const newKeys = [...config.root_ssh_keys];
                              newKeys.splice(kIdx, 1);
                              setConfig({...config, root_ssh_keys: newKeys});
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setConfig({...config, root_ssh_keys: [...config.root_ssh_keys, '']})}
                        className="text-sm text-rose-600 font-bold flex items-center hover:text-rose-700 transition-colors mt-2"
                      >
                        <Plus size={16} className="mr-1" /> {t('add_root_ssh_key')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex flex-row items-center whitespace-nowrap">
                <Clock className="text-amber-600 mr-3 flex-shrink-0" size={22} />
                <h2 className="text-lg font-bold text-slate-800">{t('regional_settings')}</h2>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('region')}</label>
                <select 
                  value={selectedRegion}
                  onChange={e => handleRegionChange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="">{t('select_region')}</option>
                  {Object.keys(TIMEZONE_DATA).map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('city_timezone')}</label>
                <select 
                  disabled={!selectedRegion}
                  value={config.timezone.split('/')[1] || ''}
                  onChange={e => handleCityChange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">{t('select_city')}</option>
                  {selectedRegion && TIMEZONE_DATA[selectedRegion].map(city => (
                    <option key={city} value={city}>{city.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              {config.timezone && (
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500 italic">{t('selected_timezone')}: <span className="font-semibold text-amber-700">{config.timezone}</span></p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex flex-row items-center whitespace-nowrap">
                <Network className="text-indigo-600 mr-3 flex-shrink-0" size={22} />
                <h2 className="text-lg font-bold text-slate-800">{t('network_interfaces')}</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {config.interfaces.map((iface, iIdx) => (
                <div key={iIdx} className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div className="flex items-center">
                      <Activity className="text-indigo-600 mr-2" size={20} />
                      <span className="font-bold text-indigo-900">{iface.name}</span>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <span className="mr-3 text-sm font-semibold text-indigo-900">{t('dhcp_v4')}</span>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={iface.dhcp4}
                          onChange={e => {
                            const newIfaces = [...config.interfaces];
                            newIfaces[iIdx].dhcp4 = e.target.checked;
                            setConfig({...config, interfaces: newIfaces});
                          }}
                        />
                        <div className={`block w-12 h-6 rounded-full transition-colors ${iface.dhcp4 ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${iface.dhcp4 ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </label>
                  </div>

                  {!iface.dhcp4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 animate-in fade-in duration-300">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                          <Globe size={16} className="mr-1" /> {t('ipv4_address')}
                        </label>
                        <input 
                          type="text" 
                          value={iface.addresses[0] || ''}
                          onChange={e => {
                            const newIfaces = [...config.interfaces];
                            newIfaces[iIdx].addresses = [e.target.value];
                            setConfig({...config, interfaces: newIfaces});
                          }}
                          placeholder="192.168.1.10/24"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                          <Server size={16} className="mr-1" /> {t('gateway')}
                        </label>
                        <input 
                          type="text" 
                          value={iface.gateway4 || ''}
                          onChange={e => {
                            const newIfaces = [...config.interfaces];
                            newIfaces[iIdx].gateway4 = e.target.value;
                            setConfig({...config, interfaces: newIfaces});
                          }}
                          placeholder="192.168.1.1"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">{t('dns_servers')}</label>
                        <input 
                          type="text" 
                          value={iface.nameservers.join(', ')}
                          onChange={e => {
                            const newIfaces = [...config.interfaces];
                            newIfaces[iIdx].nameservers = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                            setConfig({...config, interfaces: newIfaces});
                          }}
                          placeholder="8.8.8.8, 1.1.1.1"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">{t('dns_hint')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center justify-center disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('processing')}
              </span>
            ) : (
              <><Download className="mr-2" size={24} /> {t('generate_btn')}</>
            )}
          </button>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm">
          {t('footer')}
        </footer>
      </div>
    </div>
  );
}

export default App;
