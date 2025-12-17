'use client';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { userStore } from '@/stores/UserStore';
import { uiStore } from '@/stores/UIStore';
import type { Gender } from '@/types/user';

export default observer(function PersonalizePage() {
  const [formData, setFormData] = useState({
    firstName: userStore.user?.firstName || '',
    lastName: userStore.user?.lastName || '',
    phone: userStore.user?.phone || '',
    email: userStore.user?.email || '',
    gender: (userStore.user?.gender || 'prefer-not-to-say') as Gender,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      userStore.updateUser(formData);
      uiStore.navigateTo('capture');
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#f5f5f5] to-[#e0e0e0] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#003366] mb-2">
            Personalize Your Experience
          </h1>
          <p className="text-gray-600">
            Tell us a bit about yourself to get personalized results
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="First Name"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            error={errors.firstName}
            placeholder="John"
            required
          />

          <Input
            label="Last Name"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            error={errors.lastName}
            placeholder="Doe"
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

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            placeholder="john.doe@example.com"
            required
          />

          <Select
            label="Gender"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
            options={genderOptions}
            error={errors.gender}
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

