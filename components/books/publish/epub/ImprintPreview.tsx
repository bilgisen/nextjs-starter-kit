'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Pencil, Save, X } from 'lucide-react';

interface ImprintPreviewProps {
  includeImprint: boolean;
  onIncludeImprintChange: (include: boolean) => void;
}

type ImprintField = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  type: 'text' | 'textarea';
};

export function ImprintPreview({ includeImprint, onIncludeImprintChange }: ImprintPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [imprint, setImprint] = useState<ImprintField[]>([
    {
      id: 'publisher',
      label: 'Publisher',
      value: 'Your Publishing House',
      placeholder: 'Enter publisher name',
      type: 'text',
    },
    {
      id: 'address',
      label: 'Address',
      value: '123 Book Street\nCity, Country',
      placeholder: 'Enter publisher address',
      type: 'textarea',
    },
    {
      id: 'website',
      label: 'Website',
      value: 'www.example.com',
      placeholder: 'Enter website URL',
      type: 'text',
    },
    {
      id: 'email',
      label: 'Contact Email',
      value: 'contact@example.com',
      placeholder: 'Enter contact email',
      type: 'text',
    },
    {
      id: 'copyright',
      label: 'Copyright',
      value: `© ${new Date().getFullYear()} Your Name. All rights reserved.`,
      placeholder: 'Enter copyright information',
      type: 'text',
    },
  ]);

  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // Initialize editing values
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    imprint.forEach((field) => {
      initialValues[field.id] = field.value;
    });
    setEditingValues(initialValues);
  }, [imprint]);

  const handleFieldChange = (id: string, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const saveChanges = () => {
    setImprint((prev) =>
      prev.map((field) => ({
        ...field,
        value: editingValues[field.id] || field.value,
      }))
    );
    setIsEditing(false);
  };

  const cancelEditing = () => {
    const resetValues: Record<string, string> = {};
    imprint.forEach((field) => {
      resetValues[field.id] = field.value;
    });
    setEditingValues(resetValues);
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include-imprint" 
            checked={includeImprint}
            onCheckedChange={(checked) => onIncludeImprintChange(checked as boolean)}
          />
          <Label htmlFor="include-imprint">Include Imprint Page</Label>
        </div>
        
        {includeImprint && (
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={saveChanges}
                  className="h-8"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={cancelEditing}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="h-8"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {includeImprint ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Imprint Preview</h3>
              <div className="border rounded-lg p-6 space-y-4 bg-card">
                {imprint.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <Label htmlFor={field.id} className="text-sm font-medium">
                      {field.label}
                    </Label>
                    {isEditing ? (
                      field.type === 'textarea' ? (
                        <Textarea
                          id={field.id}
                          value={editingValues[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className="min-h-[80px]"
                        />
                      ) : (
                        <Input
                          type={field.type}
                          id={field.id}
                          value={editingValues[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {field.value || <span className="text-muted-foreground/50">Not provided</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {!isEditing && (
              <div className="text-sm text-muted-foreground">
                <p>
                  The imprint page will be included at the end of your EPUB. Click &quot;Edit&quot; to customize the information.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Imprint page is disabled. Enable the option above to customize.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
