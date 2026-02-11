'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { appConfig } from '@/lib/config/app-config';
import { getAllAttempts } from '@/lib/persistence/indexeddb';
import { getAttemptsForIdentity } from '@/lib/leaderboard/identity';
import { observer } from 'mobx-react-lite';
import { toastStore } from '@/stores/ToastStore';
import { uiStore } from '@/stores/UIStore';
import { useState } from 'react';
import { userStore } from '@/stores/UserStore';

export default observer(function PersonalizePage() {
  const [formData, setFormData] = useState({
    name: userStore.user?.name || '',
    phone: userStore.user?.phone || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      // Check previous attempts for this identity (phone)
      const attempts = await getAllAttempts();
      const identity = {
        phone: formData.phone.trim(),
      };

      const userAttempts = getAttemptsForIdentity(attempts, identity);
      const maxAttempts = appConfig.maxAttempts;

      if (userAttempts.length >= maxAttempts) {
        toastStore.error(
          'Maximum attempts reached for this phone number. Please contact a staff member to continue.'
        );
        return;
      }
    } catch (error) {
      console.error('Error checking attempts before camera:', error);
      // Fail open: allow play to proceed but still log error
    }

    userStore.updateUser(formData);
    uiStore.navigateTo('capture');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative">
      {/* Logo Top Right */}
      <div className="absolute top-4 left-4 w-32 h-24 z-10">
        <Logo width={128} height={96} />
      </div>
      
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-black p-8 space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">
            Personalize Your Experience
          </h1>
          <p className="text-gray-600">
            Let&apos;s put a name to that great smile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="John Doe"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
            placeholder="+1 (555) 123-4567"
            required
          />

          <div className="pt-4">
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Continue to Camera 📸
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

