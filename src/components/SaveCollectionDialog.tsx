import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';

interface SaveCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: (name: string, description?: string) => Promise<void>;
}

export function SaveCollectionDialog({
  open,
  onOpenChange,
  selectedCount,
  onSave,
}: SaveCollectionDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    if (name.length > 100) {
      setError('Collection name must be 100 characters or less');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(name.trim(), description.trim() || undefined);
      
      // Reset form
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!saving) {
      if (!newOpen) {
        // Reset form when closing
        setName('');
        setDescription('');
        setError(null);
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Issue Collection</DialogTitle>
          <DialogDescription>
            Save {selectedCount} selected issue{selectedCount !== 1 ? 's' : ''} as a named collection for future reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="collection-name">
              Collection Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="collection-name"
              placeholder="e.g., Critical Issues Sprint 1"
              value={name}
              onChange={(e) => { setName(e.target.value); }}
              maxLength={100}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-description">Description (Optional)</Label>
            <Textarea
              id="collection-description"
              placeholder="Add notes about this collection..."
              value={description}
              onChange={(e) => { setDescription(e.target.value); }}
              maxLength={500}
              rows={3}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive" role="alert">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { handleOpenChange(false); }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => { void handleSave(); }}
            disabled={saving || !name.trim()}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
