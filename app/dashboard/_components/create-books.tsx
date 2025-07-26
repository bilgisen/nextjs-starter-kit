import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function CardBanner() {
  return (
    <Card className="w-full text-center shadow-none dark py-4">
      <CardHeader>
        <CardTitle className="mb-2 text-3xl font-bold">
          Create your first book for free
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Create your first book for free now and discover the capabilities of our application.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-2 flex flex-row gap-2 justify-center">
        <Button asChild>
          <Link href="/dashboard/books/new">Create a new book</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard/books">Library</Link>
        </Button>
      </CardContent>
    </Card>
  );
}