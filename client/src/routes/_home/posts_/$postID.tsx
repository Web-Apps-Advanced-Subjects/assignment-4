import { Comments, getComments, getPostDetails } from "@libs/api";
import Post from "@libs/Post";
import { useUser } from "@libs/userContext";
import { Box, Divider, Stack, useTheme } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import InfiniteScroll from "react-infinite-scroll-component";
import Comment from "@libs/Comment";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_home/posts_/$postID")({
  component: RouteComponent,
  loader: async ({ params: { postID } }) => {
    try {
      const post = await getPostDetails(postID);

      return { post };
    } catch {
      throw notFound();
    }
  },
});

function RouteComponent() {
  const { post } = Route.useLoaderData();

  const { user } = useUser();
  const theme = useTheme();

  const { data: userComments } = useQuery({
    queryKey: ["comments", user, post._id],
    queryFn: () => {
      if (user === null) {
        throw new Error("should never be called with unknown user");
      }

      return getComments({ postID: post._id, userID: user._id });
    },
    enabled: user !== undefined,
  });

  const [comments, setComments] = useState<Comments>([]);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user === null) {
      return;
    }

    getComments({ postID: post._id, limit: 5, notUserID: user._id }).then(
      (newPosts) => setComments(newPosts)
    );
  }, [user, post]);

  const fetchMoreData = () => {
    const lastComment = comments.at(-1);

    if (lastComment === undefined || user === null) {
      return null;
    }

    getComments({
      limit: 5,
      postID: post._id,
      notUserID: user._id,
      lastID: lastComment._id,
    }).then((newPosts) => {
      setHasMore(newPosts.length > 0);
      setComments((oldComments) => oldComments.concat(newPosts));
    });
  };

  return (
    <Stack spacing={1}>
      <Box sx={{ paddingX: 2 }}>
        <Post postID={post._id} inPostPage />
      </Box>
      <Divider />
      <Stack spacing={2} sx={{ paddingX: 2 }}>
        {userComments &&
          userComments.map((comment) => (
            <Comment key={comment._id} commentID={comment._id} />
          ))}
      </Stack>

      <InfiniteScroll
        dataLength={comments.length}
        loader={<></>}
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
        {comments.map((comment) => (
          <Comment key={comment._id} commentID={comment._id} />
        ))}
      </InfiniteScroll>
    </Stack>
  );
}
