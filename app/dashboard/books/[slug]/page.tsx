import { notFound, redirect } from "next/navigation";
import { getBookBySlug } from "@/actions/books/get-book-by-slug";
import { getChaptersByBook } from "@/actions/books/get-chapters-by-book";
import { BooksMenu } from "@/components/books/books-menu";
import { SingleBookView } from "@/components/books/single-book-view";
import { SimpleChapterList } from "@/components/books/chapters/simple-chapter-list";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: { slug: string };
}

export default async function BookDetailPage({ params }: PageProps) {
  // Ensure we have the slug from params
  const { slug } = params;
  
  if (!slug) {
    redirect('/dashboard/books');
    return null;
  }

  try {
    const book = await getBookBySlug(slug);
    
    if (!book) {
      notFound();
    }
    
    // Fetch chapters for this book
    const chapters = await getChaptersByBook(book.id);
    
    return (
      <div className="space-y-6 p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
            {book.author && (
              <p className="text-muted-foreground">{book.author}</p>
            )}
          </div>
          <BooksMenu slug={slug} />
        </div>
        
        <Separator className="my-6" />
        
        {/* Book Content */}
        <div className="space-y-8">
          <SingleBookView book={book} />
          
          {/* Chapters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleChapterList chapters={chapters} />
              
              {chapters.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No chapters found. Add your first chapter to get started.
                </div>
              )}
              
              <div className="mt-4">
                <a
                  href={`/dashboard/books/${slug}/chapters/new`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  + Add Chapter
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading book:', error);
    notFound();
  }
}
