'use client';

import { useState } from 'react';
import { Book } from '@/types/book';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EpubPublishProps = {
  book: Book;
};

export default function EpubPublish({ book }: EpubPublishProps) {
  // This would be connected to a form state in a real implementation
  const [metadata, setMetadata] = useState({
    title: book.title,
    author: book.author || '',
    description: book.description || '',
    language: 'en',
    includeCover: true,
    includeToc: true,
    formatVersion: '3.0',
  });

  const handleChange = (field: string, value: string | boolean) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>EPUB Export Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Metadata</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={metadata.title} 
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input 
                id="author" 
                value={metadata.author} 
                onChange={(e) => handleChange('author', e.target.value)}
                placeholder="Author name"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={metadata.description} 
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Book description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input 
                id="language" 
                value={metadata.language} 
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="formatVersion">EPUB Version</Label>
              <Select 
                value={metadata.formatVersion} 
                onValueChange={(value) => handleChange('formatVersion', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3.0">EPUB 3.0</SelectItem>
                  <SelectItem value="2.0.1">EPUB 2.0.1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium">Content Options</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="includeCover">Include Cover</Label>
              <p className="text-sm text-muted-foreground">
                Add a cover page to the EPUB
              </p>
            </div>
            <Switch 
              id="includeCover" 
              checked={metadata.includeCover} 
              onCheckedChange={(checked) => handleChange('includeCover', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="includeToc">Include Table of Contents</Label>
              <p className="text-sm text-muted-foreground">
                Generate a clickable table of contents
              </p>
            </div>
            <Switch 
              id="includeToc" 
              checked={metadata.includeToc} 
              onCheckedChange={(checked) => handleChange('includeToc', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}