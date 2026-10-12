'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/hooks';
import { updateSettings, resetToSampleData } from '@/lib/store';
import { Currency } from '@/lib/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Coins,
  Bell,
  Palette,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const AVATAR_COLORS = [
  '#E9785B',
  '#43875A',
  '#6CA6C9',
  '#E9B94E',
  '#9B8DC4',
  '#D9658B',
  '#38A3A5',
  '#F4A261',
];

export default function SettingsPage() {
  const { state, refresh } = useStore();
  const { toast } = useToast();

  const currentUser = state.users.find(u => u.id === state.settings.currentUserId);

  const [name, setName] = useState(currentUser?.name || 'Arjun Sharma');
  const [email, setEmail] = useState(currentUser?.email || 'arjun@example.com');
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || '#E9785B');
  const [currency, setCurrency] = useState<Currency>(state.settings.currency || 'INR');
  const [notifications, setNotifications] = useState(state.settings.notifications ?? true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: name.trim(),
      userEmail: email.trim(),
      userAvatarColor: avatarColor,
      currency,
      notifications,
    });

    toast({
      title: 'Settings saved! ✨',
      description: 'Your profile and preferences have been updated.',
    });
  };

  const handleResetData = () => {
    if (
      confirm(
        'Are you sure you want to reset all data back to the demo sample data? This will overwrite your current changes.'
      )
    ) {
      resetToSampleData();
      refresh();
      toast({
        title: 'Demo data restored',
        description: 'Spendwise has been reset to the default sample dataset.',
      });
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your personal profile, default currency, and application preferences.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6 rounded-3xl bg-white border border-border/70 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <User size={18} className="text-coral" />
              <h2 className="text-base font-bold text-ink">User Profile</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-sm"
                  style={{ backgroundColor: avatarColor }}
                >
                  {name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">Avatar Preview</span>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-10 rounded-xl bg-muted/30 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-10 rounded-xl bg-muted/30"
                    required
                  />
                </div>

                {/* Avatar Color Swatches */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Avatar Color
                  </Label>
                  <div className="flex flex-wrap gap-2.5">
                    {AVATAR_COLORS.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setAvatarColor(c)}
                        className={`w-7 h-7 rounded-full transition-all ${
                          avatarColor === c
                            ? 'ring-2 ring-offset-2 ring-ink scale-110'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Preferences Card */}
          <Card className="p-6 rounded-3xl bg-white border border-border/70 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <Coins size={18} className="text-sunshine" />
              <h2 className="text-base font-bold text-ink">Preferences</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Default Currency
                </Label>
                <Select value={currency} onValueChange={val => setCurrency(val as Currency)}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR — Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground block">
                  Used for total rollups and quick entry defaults.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Theme
                </Label>
                <div className="h-10 px-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-xs font-medium text-ink">
                  <span>Warm Cream (Community Edition)</span>
                  <span className="w-3 h-3 rounded-full bg-coral inline-block" />
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Warm palette with Coral, Leaf Green & Sunshine Yellow.
                </span>
              </div>
            </div>

            {/* Notification toggle */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Activity Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive simulated toast alerts whenever expenses or settlements are added.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  notifications ? 'bg-coral' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="rounded-xl bg-coral hover:bg-coral/90 text-white font-semibold px-6 h-10 shadow-sm"
            >
              Save Preferences
            </Button>
          </div>
        </form>

        {/* Demo Data Reset Section */}
        <Card className="p-6 rounded-3xl bg-[#FFF8EF] border border-border/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw size={18} className="text-muted-foreground" />
              <h3 className="text-base font-bold text-ink">Reset Demo Data</h3>
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-lg">
            Want to start over or return to the clean demo dataset? This restores the realistic sample
            groups, trips, expenses and settlement history.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleResetData}
            className="rounded-xl border-border hover:bg-white text-xs font-semibold text-ink h-9 mt-1"
          >
            <RotateCcw size={13} className="mr-1.5" />
            Restore Sample Data
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
