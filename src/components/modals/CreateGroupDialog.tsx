'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/lib/hooks';
import { createGroup, createUser } from '@/lib/store';
import { Currency, GroupMember } from '@/lib/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/hooks/use-toast';
import { Check, Plus, UserPlus } from 'lucide-react';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: (groupId: string) => void;
}

const PRESET_EMOJIS = ['🏖️', '🏠', '🍜', '✈️', '🎉', '🚗', '🏔️', '🍕', '🍻', '🛍️', '⚽', '🎮'];
const PRESET_COLORS = ['#E9785B', '#43875A', '#6CA6C9', '#E9B94E', '#9B8DC4', '#D9658B', '#38A3A5', '#F4A261'];

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
  const { state } = useStore();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🏖️');
  const [color, setColor] = useState('#6CA6C9');
  const [currency, setCurrency] = useState<Currency>('INR');

  // Selected member IDs (currentUser is always selected)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([state.settings.currentUserId]);

  // Quick add new member
  const [isAddingNewUser, setIsAddingNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  const toggleUserSelection = (userId: string) => {
    if (userId === state.settings.currentUserId) return; // cannot remove yourself
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const user = createUser({
      name: newUserName.trim(),
      email: newUserEmail.trim() || `${newUserName.toLowerCase().replace(/\s+/g, '')}@example.com`,
    });
    setSelectedUserIds([...selectedUserIds, user.id]);
    setNewUserName('');
    setNewUserEmail('');
    setIsAddingNewUser(false);
    toast({ title: 'Member added', description: `${user.name} added to your contacts.` });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Group name required', description: 'Please give your group a name.', variant: 'destructive' });
      return;
    }

    const members: GroupMember[] = selectedUserIds.map(userId => ({
      userId,
      role: userId === state.settings.currentUserId ? 'admin' : 'member',
      joinedAt: new Date().toISOString(),
    }));

    const newGroup = createGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      emoji,
      color,
      currency,
      members,
    });

    toast({
      title: 'Group created! 🎉',
      description: `"${newGroup.name}" is ready with ${members.length} members.`,
    });

    onOpenChange(false);
    if (onGroupCreated) onGroupCreated(newGroup.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-ink">Create a New Group</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Share expenses effortlessly with roommates, trips, or friends.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Emoji & Group Name */}
          <div className="flex gap-3 items-start">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Icon
              </Label>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: `${color}25` }}
              >
                {emoji}
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Group Name
              </Label>
              <Input
                placeholder="e.g. Manali Roadtrip, Apartment 302"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-12 rounded-xl bg-muted/40 font-medium"
                required
              />
            </div>
          </div>

          {/* Emoji Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Choose Avatar
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_EMOJIS.map(em => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                    emoji === em ? 'scale-110 bg-coral/20 ring-2 ring-coral' : 'bg-muted/40 hover:bg-muted'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Color Theme
            </Label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-ink scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Description & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description (optional)
              </Label>
              <Input
                placeholder="What is this group for?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="h-10 rounded-xl bg-muted/40 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Currency
              </Label>
              <Select value={currency} onValueChange={val => setCurrency(val as Currency)}>
                <SelectTrigger className="h-10 rounded-xl bg-muted/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Members Selection */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Group Members ({selectedUserIds.length})
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingNewUser(!isAddingNewUser)}
                className="h-7 text-xs text-coral hover:text-coral hover:bg-coral/10 gap-1"
              >
                <UserPlus size={13} />
                Add Person
              </Button>
            </div>

            {/* Quick Add Person Form */}
            {isAddingNewUser && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2.5 animate-in fade-in">
                <p className="text-xs font-semibold text-ink">New Member Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Full Name"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAddingNewUser(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewUser}
                    className="h-7 text-xs bg-coral text-white hover:bg-coral/90"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Member list to toggle */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {state.users.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                const isSelf = user.id === state.settings.currentUserId;

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-coral/40 bg-coral/5' : 'border-border/60 bg-white opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-coral border-coral text-white' : 'border-border bg-white'
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <UserAvatar user={user} size="xs" />
                      <span className="text-xs font-medium text-ink">
                        {user.name} {isSelf ? '(You)' : ''}
                      </span>
                    </div>
                    {isSelf && (
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted">
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="rounded-xl bg-coral hover:bg-coral/90 text-white font-semibold"
            >
              Create Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
