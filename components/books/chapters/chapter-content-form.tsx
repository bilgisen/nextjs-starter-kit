"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { chapterFormSchema } from "@/schemas/chapter-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ParentChapterSelect } from "./ParentChapterSelect";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { toast } from "sonner";


type ChapterFormValues = z.infer<typeof chapterFormSchema>;

type Chapter = {
  id: string;
  title: string;
  level: number;
};

type ChapterContentFormProps = {
  initialData?: Partial<ChapterFormValues>;
  parentChapters: Chapter[];
  currentChapterId?: string;
  onSubmit: (values: ChapterFormValues) => Promise<{ success: boolean; redirectUrl?: string }>;
  disabled?: boolean;
  loading?: boolean;
  submitButtonText?: string;
  bookSlug: string;
};

export const ChapterContentForm = React.forwardRef<HTMLFormElement, ChapterContentFormProps>(({
  initialData,
  parentChapters,
  currentChapterId,
  onSubmit,
  bookSlug,
  disabled = false,
  loading = false,
  submitButtonText = "Save Chapter",
}, ref) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      parent_chapter_id: initialData?.parent_chapter_id ?? null,
    },
  });

  const { handleSubmit, control, watch, setValue } = form;

  const handleFormSubmit = async (values: ChapterFormValues) => {
    try {
      setIsSubmitting(true);
      const result = await onSubmit(values);
      
      if (result?.success) {
        toast.success("Chapter saved successfully");
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        } else {
          // Fallback to the book's chapters page
          router.push(`/dashboard/books/${bookSlug}/chapters`);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "An error occurred while saving the chapter."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredParentChapters = parentChapters.filter(
    (chapter) => chapter.id !== currentChapterId
  );

  return (
    <Form {...form}>
      <form ref={ref} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground/50">Chapter Title</FormLabel>
                <FormControl>
                  <Input 
                    disabled={disabled}
                    placeholder="Enter chapter title"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="parent_chapter_id"
            render={() => (
              <FormItem>
                <FormLabel className="text-muted-foreground/50">Parent Chapter (Optional)</FormLabel>
                <FormControl>
                  <ParentChapterSelect
                    parentChapters={filteredParentChapters}
                    value={watch("parent_chapter_id")}
                    onChange={(value) => setValue("parent_chapter_id", value)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Content with Tiptap */}
        <Controller
          name="content"          
          control={control}
          render={({ field: { onChange, value } }) => (
            <FormItem>
              <FormControl>
                <SimpleEditor
                  initialContent={value || ''}
                  onChange={onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={disabled || isSubmitting || loading}
            className="w-full sm:w-auto"
          >
            {(isSubmitting || loading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
});

ChapterContentForm.displayName = 'ChapterContentForm';
