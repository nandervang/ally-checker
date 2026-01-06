/**
 * CollectionManagementDialog - Edit and delete collections
 * 
 * Provides UI for managing saved collections:
 * - Edit collection name and description
 * - Delete collections with confirmation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { updateCollection, deleteCollection } from '@/lib/collectionService';
import type { IssueCollection } from '@/lib/collectionService';
import { toast } from 'sonner';

interface CollectionManagementDialogProps {
  collection: IssueCollection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollectionUpdated: () => void;
  onCollectionDeleted: () => void;
}

export function CollectionManagementDialog({
  collection,
  open,
  onOpenChange,
  onCollectionUpdated,
  onCollectionDeleted,
}: CollectionManagementDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Update form when collection changes
  useState(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || '');
    }
  });

  const handleSave = async () => {
    if (!collection || !name.trim()) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateCollection(collection.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (error) {
        toast.error('Failed to update collection');
        return;
      }

      toast.success('Collection updated successfully');
      onCollectionUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update collection');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!collection) return;

    setDeleting(true);
    try {
      const { error } = await deleteCollection(collection.id);

      if (error) {
        toast.error('Failed to delete collection');
        return;
      }

      toast.success(`Collection "${collection.name}" deleted`);
      setDeleteDialogOpen(false);
      onOpenChange(false);
      onCollectionDeleted();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete collection');
    } finally {
      setDeleting(false);
    }
  };

  if (!collection) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Manage Collection</DialogTitle>
            <DialogDescription>
              Update the name and description of your collection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-collection-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-collection-name"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                maxLength={100}
                disabled={saving}
                placeholder="Collection name"
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-collection-description">Description (Optional)</Label>
              <Textarea
                id="edit-collection-description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); }}
                maxLength={500}
                rows={3}
                disabled={saving}
                placeholder="Add notes about this collection..."
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <span className="text-sm text-muted-foreground">
                <strong>{collection.issue_count || 0}</strong> issues • Created {new Date(collection.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => { setDeleteDialogOpen(true); }}
              disabled={saving || deleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Collection
            </Button>
            <div className="flex gap-2 flex-1 justify-end">
              <Button
                variant="outline"
                onClick={() => { onOpenChange(false); }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={() => { void handleSave(); }}
                disabled={saving || !name.trim()}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;<strong>{collection.name}</strong>&rdquo;?
              This action cannot be undone. The collection and its saved issue selections will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
