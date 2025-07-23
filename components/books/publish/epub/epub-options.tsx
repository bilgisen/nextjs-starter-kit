'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EpubOptionsProps = {
  includeToc: boolean;
  includeImprint: boolean;
  style: 'default' | 'modern';
  onTocChange: (checked: boolean) => void;
  onImprintChange: (checked: boolean) => void;
  onStyleChange: (value: 'default' | 'modern') => void;
};

export function EpubOptions({
  includeToc,
  includeImprint,
  style,
  onTocChange,
  onImprintChange,
  onStyleChange,
}: EpubOptionsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">ePub Options</h3>
        <p className="text-sm text-muted-foreground">
          Customize your eBook export settings
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include-toc" 
            checked={includeToc}
            onCheckedChange={(checked) => onTocChange(checked as boolean)}
          />
          <Label htmlFor="include-toc" className="text-sm font-medium leading-none">
            Add Table of Contents
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include-imprint" 
            checked={includeImprint}
            onCheckedChange={(checked) => onImprintChange(checked as boolean)}
          />
          <Label htmlFor="include-imprint" className="text-sm font-medium leading-none">
            Add Imprint
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="style" className="text-sm font-medium">
            Select Style
          </Label>
          <Select
            value={style}
            onValueChange={(value: 'default' | 'modern') => onStyleChange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
