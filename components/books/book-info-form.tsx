"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import slugify from "slugify";
import type { Book } from "@/types/book";

const bookSchema = z.object({
  title: z.string().min(1, "Required field"),
  slug: z.string().min(1, "Required field"),
  author: z.string().min(1, "Required field"),
  publisher: z.string().min(1, "Required field"),
  description: z.string().optional(),
  isbn: z.string().optional(),
  publish_year: z.coerce.number().int().min(0, "Invalid year").optional(),
  language: z.string().min(2, "Invalid language code").optional(),
  cover_image_url: z.string().url().optional(),
}) satisfies z.ZodType<BookFormValues>;

export type BookFormValues = Omit<Book, 'id' | 'userId' | 'created_at' | 'updated_at' | 'status'>;

export function BookInfoForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: BookFormValues) => void;
  defaultValues?: Partial<BookFormValues>;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: defaultValues ?? {},
  });

  const titleValue = useWatch({ control, name: "title" });

  useEffect(() => {
    if (titleValue) {
      const generatedSlug = slugify(titleValue, { lower: true, strict: true });
      setValue("slug", generatedSlug);
    }
  }, [titleValue, setValue]);

  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data: BookFormValues) => {
    setLoading(true);
    await onSubmit(data);
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col md:flex-row w-full gap-8"
    >
      {/* Main Form */}
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground/50 mb-1">Title</label>
          <input
            type="text"
            {...register("title")}
            className="w-full border px-3 py-2 rounded text-md"
          />
          {errors.title && <p className="text-red-500 text-md">{errors.title.message}</p>}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground/50 mb-1">Author</label>
            <input
              type="text"
              {...register("author")}
              className="w-full border px-3 py-2 rounded text-md"
            />
            {errors.author && <p className="text-red-500 text-md">{errors.author.message}</p>}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground/50 mb-1">Publisher</label>
            <input
              type="text"
              {...register("publisher")}
              className="w-full border px-3 py-2 rounded text-md"
            />
            {errors.publisher && <p className="text-red-500 text-md">{errors.publisher.message}</p>}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground/50 mb-1">ISBN</label>
            <input
              type="text"
              {...register("isbn")}
              className="w-full border px-3 py-2 rounded text-md"
            />
            {errors.isbn && <p className="text-red-500 text-sm">{errors.isbn.message}</p>}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground/50 mb-1">Publish Year</label>
            <input
              type="number"
              {...register("publish_year")}
              className="w-full border px-3 py-2 rounded text-md"
            />
            {errors.publish_year && <p className="text-red-500 text-md">{errors.publish_year.message}</p>}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground/50 mb-1">Language</label>
            <input
              type="text"
              {...register("language")}
              className="w-full border px-3 py-2 rounded text-md"
            />
            {errors.language && <p className="text-red-500 text-md">{errors.language.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground/50 mb-1">Description</label>
          <textarea
            {...register("description")}
            className="w-full border px-3 py-2 rounded text-md min-h-[100px]"
          />
        </div>

        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm mt-4 hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Divider and Sidebar */}

      <div className="md:w-72 w-full md:pl-0 pl-0 flex flex-col">
        <label className="block text-sm font-medium mb-2 text-muted-foreground/50">Cover Image</label>
        <Controller
          name="cover_image_url"
          control={control}
          render={({ field }) => (
            <ImageUploadField value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.cover_image_url && (
          <p className="text-red-500 text-sm mt-1">{errors.cover_image_url.message}</p>
        )}
      </div>
    </form>
  );
}
