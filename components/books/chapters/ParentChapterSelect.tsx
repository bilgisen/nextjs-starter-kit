"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Chapter = {
  id: string;
  title: string;
};

type Props = {
  parentChapters: Chapter[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export const ParentChapterSelect = ({
  parentChapters,
  value,
  onChange,
  disabled = false,
  className,
}: Props) => {
  // Her zaman string: null/undefined => "none"
  const selectValue = value ?? "none";

  const handleChange = (val: string) => {
    onChange(val === "none" ? null : val);
  };

  return (
    <Select value={selectValue} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select parent chapter" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No parent</SelectItem>
        {parentChapters.map((chapter) => (
          <SelectItem key={chapter.id} value={chapter.id}>
            {chapter.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
