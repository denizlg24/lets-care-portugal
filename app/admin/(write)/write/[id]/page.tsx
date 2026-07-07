import { notFound } from "next/navigation";
import { BlogContentEditor } from "@/components/admin/blog-content-editor";
import { getBlogById } from "@/lib/blog/service";
import { isValidObjectId } from "@/lib/blog/utils";

type RouteParams = { params: Promise<{ id: string }> };

export default async function EditBlogWritePage({ params }: RouteParams) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const blog = await getBlogById(id);
  if (!blog) notFound();

  return (
    <BlogContentEditor
      initial={{ id: blog._id, title: blog.title, content: blog.content, status: blog.status }}
    />
  );
}
