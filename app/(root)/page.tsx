import PostCard from "@/components/cards/PostCard";
import { fetchPosts } from "@/lib/actions/post.action";
import { currentUser } from "@clerk/nextjs";

export default async function Home() {
  const result = await fetchPosts(1, 35);
  const user = await currentUser();

  return (
    <>
      <h1 className="head-text text-left">
        Home <span className="orange_gradient">Page</span>
      </h1>

      <section className="mt-9 flex flex-col gap-10">
        {result.posts.length === 0 ? (
          <p className="no-result"> Sorry...No posts found</p>
        ) : (
          <>
            {result.posts.map((post) => (
              <PostCard
                key={post._id}
                id={post._id}
                currentUserId={user?.id || ""}
                parentId={post.parentId}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
                likes={post.likes}
              />
            ))}
          </>
        )}
      </section>
    </>
  );
}
