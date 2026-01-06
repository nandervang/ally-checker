/**
 * CollectionLoader - Load saved issue collections
 * 
 * Displays a dropdown of saved collections for the current audit.
 * When selected, loads the collection and pre-selects the saved issues.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, Loader2 } from 'lucide-react';
import { getUserCollections, getCollection } from '@/lib/collectionService';
import type { IssueCollection } from '@/lib/collectionService';
import { toast } from 'sonner';

interface CollectionLoaderProps {
  auditId: string;
  onLoadCollection: (issueIds: string[], collectionName: string) => void;
}

export function CollectionLoader({ auditId, onLoadCollection }: CollectionLoaderProps) {
  const [collections, setCollections] = useState<IssueCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCollectionId, setLoadingCollectionId] = useState<string | null>(null);

  useEffect(() => {
    void loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditId]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const { collections: userCollections, error } = await getUserCollections();
      
      if (error) {
        console.error('Failed to load collections:', error);
        return;
      }

      // Filter collections for this audit
      const auditCollections = userCollections.filter(c => c.audit_id === auditId);
      setCollections(auditCollections);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCollection = async (collectionId: string, collectionName: string) => {
    setLoadingCollectionId(collectionId);
    try {
      const { collection, error } = await getCollection(collectionId);
      
      if (error || !collection) {
        toast.error('Failed to load collection');
        return;
      }

      onLoadCollection(collection.issue_ids, collectionName);
      toast.success(`Loaded "${collectionName}" (${String(collection.issue_ids.length)} issues)`);
    } catch (error) {
      console.error('Error loading collection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load collection');
    } finally {
      setLoadingCollectionId(null);
    }
  };

  if (collections.length === 0 && !loading) {
    return null; // Don't show if no collections
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || collections.length === 0}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <FolderOpen className="mr-2 h-4 w-4" />
              Load Collection ({collections.length})
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Saved Collections</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {collections.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No saved collections
          </div>
        ) : (
          collections.map((collection) => (
            <DropdownMenuItem
              key={collection.id}
              onClick={() => { void handleLoadCollection(collection.id, collection.name); }}
              disabled={loadingCollectionId === collection.id}
            >
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{collection.name}</span>
                  {loadingCollectionId === collection.id && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                </div>
                {collection.description && (
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {collection.description}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {collection.issue_count || 0} issues • {new Date(collection.created_at).toLocaleDateString()}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
