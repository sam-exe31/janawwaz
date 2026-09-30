import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/form';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../lib/toast';

export default function Profile() {
  const { i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const switchRole = useAuthStore((s) => s.switchRole);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState('Pune, Maharashtra');

  const handleSave = () => {
    if (user) {
      setUser({
        ...user,
        name,
        email,
        phone,
      });
      toast.success('Profile preferences updated.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Citizen Profile & System Settings"
        subtitle="Manage personal identification, multilingual preferences, and civic credentials"
      />

      <Card className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-border pb-3">
          Personal Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="name"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="phone"
            label="Mobile Number (SMS Alerts)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            id="city"
            label="Primary Municipal Jurisdiction"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-border pb-3">
          Multilingual UI & AI Voice Language
        </h3>
        <p className="text-xs text-slate-500">
          Janavaaj supports real-time translation for English, Hindi, and Marathi across text and voice.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'en', label: 'English', desc: 'Default Latin UI' },
            { key: 'hi', label: 'हिंदी (Hindi)', desc: 'देवनागरी इंटरफ़ेस' },
            { key: 'mr', label: 'मराठी (Marathi)', desc: 'स्थानिक भाषा' },
          ].map((lang) => (
            <button
              key={lang.key}
              type="button"
              onClick={() => i18n.changeLanguage(lang.key)}
              className={`rounded-xl border p-3 text-left transition-all ${
                i18n.language === lang.key
                  ? 'border-primary bg-primary-soft/40 shadow-xs'
                  : 'border-border bg-surface hover:bg-bg'
              }`}
            >
              <p className="font-bold text-slate-900 text-xs">{lang.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{lang.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-border pb-3">
          Demonstration Role Switcher
        </h3>
        <p className="text-xs text-slate-500">
          Quickly inspect other role dashboards for hackathon review without logging out:
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant={user?.role === 'CITIZEN' ? 'primary' : 'outline'}
            onClick={() => {
              switchRole('CITIZEN');
              toast.success('Switched to Citizen role.');
            }}
          >
            Citizen Dashboard
          </Button>
          <Button
            size="sm"
            variant={user?.role === 'NGO' ? 'primary' : 'outline'}
            className={user?.role === 'NGO' ? 'bg-partner hover:bg-purple-700 text-white' : ''}
            onClick={() => {
              switchRole('NGO');
              toast.success('Switched to NGO / CSR role.');
            }}
          >
            NGO / CSR Dashboard
          </Button>
          <Button
            size="sm"
            variant={user?.role === 'ADMIN' ? 'primary' : 'outline'}
            className={user?.role === 'ADMIN' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            onClick={() => {
              switchRole('ADMIN');
              toast.success('Switched to Policymaker Command role.');
            }}
          >
            Policymaker Command
          </Button>
        </div>
      </Card>
    </div>
  );
}
