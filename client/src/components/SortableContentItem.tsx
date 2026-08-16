import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Edit, Trash2, Loader2, Image as ImageIcon, Video, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface SortableContentItemProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onDuplicate: (item: any) => void;
  isDeleting: boolean;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
}

export default function SortableContentItem({ item, onEdit, onDelete, onDuplicate, isDeleting, isSelected, onToggleSelect }: SortableContentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Checkbox */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                // Only toggle if the checked state actually changed
                if (checked !== isSelected) {
                  onToggleSelect(item.id);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {/* Drag handle */}
            <button
              className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <div className="flex-1">
              <CardTitle className="text-lg">{item.title || 'Untitled'}</CardTitle>
              {item.subtitle && (
                <CardDescription>{item.subtitle}</CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(item)}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2">
          {item.content && (
            <p className="text-sm text-muted-foreground">{item.content}</p>
          )}
          {item.imageUrl && (
            <div className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4" />
              <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View Image
              </a>
            </div>
          )}
          {item.videoUrl && (
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4" />
              <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View Video
              </a>
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Order: {item.displayOrder}</span>
            <span>Status: {item.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
