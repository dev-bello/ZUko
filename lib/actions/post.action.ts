"use server";

import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";

import User from "../models/user.model";
import Post from "../models/post.model";
import Community from "../models/community.model";

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  connectToDB();

  // Calculate the number of posts to skip based on the page number and page size.
  const skipAmount = (pageNumber - 1) * pageSize;

  // Create a query to fetch the posts that have no parent (top-level post) (a post that is not a comment/reply).
  const postsQuery = Post.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
    })
    .populate({
      path: "community",
      model: Community,
    })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    });

  // Count the total number of top-level posts (post)
  const totalPostsCount = await Post.countDocuments({
    parentId: { $in: [null, undefined] },
  }); // Get the total count of posts

  const posts = await postsQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts, isNext };
}

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export async function createPost({ text, author, communityId, path }: Params) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdPost = await Post.create({
      text,
      author,
      community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
    });

    // Update User model
    await User.findByIdAndUpdate(author, {
      $push: { post: createdPost._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { posts: createdPost._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create Post: ${error.message}`);
  }
}

async function fetchAllChildPosts(postId: string): Promise<any[]> {
  const childPosts = await Post.find({ parentId: postId });

  const descendantPosts = [];
  for (const childPost of childPosts) {
    const descendants = await fetchAllChildPosts(childPost._id);
    descendantPosts.push(childPost, ...descendants);
  }

  return descendantPosts;
}

export async function deletePost(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    const mainPost = await Post.findById(id).populate("author community");

    if (!mainPost) {
      throw new Error("Post not found");
    }

    const descendantPosts = await fetchAllChildPosts(id);

    const descendantPostIds = [id, ...descendantPosts.map((post) => post._id)];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantPosts.map((post) => post.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainPost.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantPosts.map((post) => post.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainPost.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    await Post.deleteMany({ _id: { $in: descendantPostIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { posts: { $in: descendantPostIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { posts: { $in: descendantPostIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
}

export async function fetchPostById(postId: string) {
  connectToDB();

  try {
    const post = await Post.findById(postId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      }) // Populate the community field with _id and name
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children",
            model: Post,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .exec();

    return post;
  } catch (err) {
    console.error("Error while fetching post:", err);
    throw new Error("Unable to fetch post");
  }
}

export async function addCommentToPost(
  postId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB();

  try {
    const originalPost = await Post.findById(postId);

    if (!originalPost) {
      throw new Error("Post not found");
    }

    const commentPost = new Post({
      text: commentText,
      author: userId,
      parentId: postId,
    });

    const savedCommentPost = await commentPost.save();

    originalPost.children.push(savedCommentPost._id);

    await originalPost.save();

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}

export async function addLikeToPost(
  postId: string,
  userId: string,
  path: string
) {
  connectToDB();

  try {
    const postToLike = await Post.findById(postId);

    if (!postToLike) {
      throw new Error("Post not found");
    }

    const userHasLikedPost = postToLike.likes.includes(userId);

    if (userHasLikedPost) {
      postToLike.likes.remove(userId);
    } else {
      postToLike.likes.push(userId);
    }

    await postToLike.save();

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error adding like to Post: ${error.message}`);
  }
}
