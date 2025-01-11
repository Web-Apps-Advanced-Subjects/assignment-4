import {
  Avatar,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { boxBorderRadius, buttonBorderRadius } from "@libs/consts";
import LikeButton from "@libs/LikeButton";
import CommentButton from "@libs/CommentButton";
import {
  getPostDetails,
  getUserDetails,
  type Post as PostApi,
} from "@libs/api";
import PostMoreButton from "@libs/PostMoreButton";
import { createLink } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useUser } from "./userContext";

const CardActionAreaLink = createLink(CardActionArea);

type _OptionalCardActionAreaLinkProps = {
  children: ReactNode;
  inPostPage: boolean;
  postID: PostApi["_id"];
};

const _OptionalCardActionAreaLink = (
  props: _OptionalCardActionAreaLinkProps
) => {
  const { inPostPage, postID, children } = props;

  if (inPostPage) {
    return children;
  } else {
    return (
      <CardActionAreaLink to="/posts/$postID" params={{ postID }}>
        {children}
      </CardActionAreaLink>
    );
  }
};

type PostProps = {
  postID: PostApi["_id"];
  inPostPage?: boolean;
};

const Post = (props: PostProps) => {
  const { postID, inPostPage = false } = props;

  const { user } = useUser();

  const { data: postDetails } = useQuery({
    queryKey: ["postDetails", postID],
    queryFn: () => {
      return getPostDetails(postID);
    },
  });

  const { data: postOwnerDetails } = useQuery({
    queryKey: ["userDetails", postDetails?.userID],
    queryFn: () => {
      if (postDetails?.userID === undefined) {
        throw new Error("should never be called with unknown user");
      }

      return getUserDetails(postDetails.userID);
    },
    enabled: postDetails?.userID !== undefined,
  });

  console.log(postDetails?.content);

  return (
    <Card sx={{ borderRadius: boxBorderRadius }}>
      <_OptionalCardActionAreaLink inPostPage={inPostPage} postID={postID}>
        <CardHeader
          avatar={
            <Avatar src={`http://localhost:3000/${postOwnerDetails?.avatar}`} />
          }
          action={
            inPostPage &&
            postDetails?.userID === user?._id && (
              <PostMoreButton
                postID={postID}
                avatar={postOwnerDetails?.avatar}
                content={postDetails?.content}
                media={postDetails?.media}
              />
            )
          }
          title={postOwnerDetails?.username}
        />
        <CardContent>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}
          >
            {postDetails?.content}
          </Typography>
        </CardContent>
        {postDetails?.media && (
          <CardMedia
            component="img"
            image={`http://localhost:3000/${postDetails?.media}`}
            sx={{ padding: 2, maxHeight: 500 }}
          />
        )}
      </_OptionalCardActionAreaLink>
      <CardActions disableSpacing>
        <Stack direction="row" spacing={2}>
          <LikeButton
            postID={postID}
            sx={{ borderRadius: buttonBorderRadius }}
          />
          {postDetails && (
            <CommentButton
              postID={postID}
              userID={postDetails.userID}
              content={postDetails.content}
              sx={{ borderRadius: buttonBorderRadius }}
            />
          )}
        </Stack>
      </CardActions>
    </Card>
  );
};

export default Post;
