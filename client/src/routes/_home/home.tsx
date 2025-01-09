import { createFileRoute } from "@tanstack/react-router";

import { Stack } from "@mui/material";
import { useUser } from "@libs/userContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Post from "@libs/Post";
import { Post as PostApi, Posts, getPosts } from "@libs/api";

export const Route = createFileRoute("/_home/home")({
  component: HomeComponent,
});

function HomeComponent() {
  const [posts, setPosts] = useState<Posts>([]);
  const [lastPostID, setLastPostID] = useState<PostApi["_id"] | null>(null);
  const { user } = useUser();

  // const lastPostID = useMemo(() => {
  //   const lastPost = posts.at(-1);

  //   if (lastPost === undefined) {
  //     return null;
  //   }

  //   return lastPost._id;
  // }, [posts]);

  // const { data: receivedPosts } = useQuery({
  //   queryKey: [user, lastPostID],
  //   queryFn: () => {
  //     if (user === null) {
  //       throw new Error("should never be called with unknown user");
  //     }

  //     return getPosts(user.accessToken, lastPostID);
  //   },
  //   enabled: user !== undefined,
  // });

  // useEffect(() => {
  //   if (receivedPosts !== undefined) {
  //     console.log(receivedPosts);
  //     console.log(posts);
  //     setPosts((oldPosts) => oldPosts.concat(receivedPosts));
  //   }
  // }, [receivedPosts]);

  const handleScroll = () => {
    const scrollY = window.scrollY;
    console.log(scrollY);
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollY + windowHeight >= documentHeight - 100) {
      const lastPost = posts.at(-1);

      if (lastPost === undefined) {
        setLastPostID(null);
      } else {
        setLastPostID(lastPost._id);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastPostID]);

  useEffect(() => {
    // setPosts(async (oldPosts) => {
    //   return oldPosts;
    // });
    if (user === null) {
      return;
    }

    getPosts(user.accessToken, lastPostID).then((newPosts) => {
      setPosts((oldPosts) => oldPosts.concat(newPosts));
    });
  }, [user, lastPostID]);

  const unlistPost = (postID: string) => (): void => {
    setPosts((oldPosts) => oldPosts.filter((post) => post._id !== postID));
  };

  return (
    <Stack spacing={1.5} sx={{ paddingX: 2, height: "100%" }}>
      {posts.map((post) => (
        <Post
          key={post._id}
          postID={post._id}
          unlistPost={unlistPost(post._id)}
        />
      ))}
    </Stack>
  );
}
