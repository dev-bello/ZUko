"use client";

import { addLikeToPost } from "@/lib/actions/post.action";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LikePost = ({
  likes,
  postId,
  currentUserId,
}: {
  likes: Array<any>;
  postId: string;
  currentUserId: string;
}) => {
  const pathname = usePathname();

  const currentUserLiked = likes.includes(currentUserId);

  return (
    <>
      <div
        onClick={async () => {
          await addLikeToPost(postId, currentUserId, pathname);
        }}
      >
        <Image
          src={
            currentUserLiked
              ? "/assets/heart-like.svg"
              : "/assets/heart-gray.svg"
          }
          alt="heart"
          width={24}
          height={24}
          className="cursor-pointer object-contain"
        />
      </div>
      <p className="mt-1 text-subtle-medium text-gray-1">{likes.length}</p>
    </>
  );
};

export default LikePost;
