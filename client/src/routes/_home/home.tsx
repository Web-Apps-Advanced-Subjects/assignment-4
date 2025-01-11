import { createFileRoute } from "@tanstack/react-router";

import { useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import Post from "@libs/Post";
import { Posts, getPosts } from "@libs/api";
import InfiniteScroll from "react-infinite-scroll-component";

export const Route = createFileRoute("/_home/home")({
  component: HomeComponent,
});

function HomeComponent() {
  const [posts, setPosts] = useState<Posts>([]);
  const [hasMore, setHasMore] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    getPosts().then((newPosts) => setPosts(newPosts));
  }, []);

  const fetchMoreData = () => {
    const lastPost = posts.at(-1);

    if (lastPost === undefined) {
      return null;
    }

    getPosts({ lastID: lastPost._id }).then((newPosts) => {
      setHasMore(newPosts.length > 0);
      console.log(newPosts.length);
      setPosts((oldPosts) => oldPosts.concat(newPosts));
    });
  };

  return (
    <InfiniteScroll
      dataLength={posts.length}
      loader={<h1>Wow</h1>}
      hasMore={hasMore}
      next={fetchMoreData}
      style={{
        display: "flex",
        flexDirection: "column",
        paddingLeft: `calc(${theme.spacing()} * 2)`,
        paddingRight: `calc(${theme.spacing()} * 2)`,
        gap: `calc(${theme.spacing()} * 1.5)`,
      }}
    >
      {posts.map((post) => (
        <Post key={post._id} postID={post._id} />
      ))}
    </InfiniteScroll>
  );
}
