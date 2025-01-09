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
import { useUser } from "@libs/userContext";
import { boxBorderRadius, buttonBorderRadius } from "@libs/consts";
import LikeButton from "@libs/LikeButton";
import CommentButton from "@libs/CommentButton";
import {
  getPostDetails,
  getUserDetails,
  type Post as PostApi,
} from "@libs/api";

type PostProps = {
  postID: PostApi["_id"];
  unlistPost: () => void;
};

const Post = (props: PostProps) => {
  const { postID } = props;

  const { user } = useUser();

  const { data: postDetails } = useQuery({
    queryKey: [user, postID],
    queryFn: () => {
      if (user === null) {
        throw new Error("should never be called with unknown user");
      }

      return getPostDetails(user.accessToken, postID);
    },
    enabled: user !== undefined,
  });

  const { data: postOwnerDetails } = useQuery({
    queryKey: [user, postDetails],
    queryFn: () => {
      if (user === null || postDetails === undefined) {
        throw new Error("should never be called with unknown user");
      }

      return getUserDetails(user.accessToken, postDetails.userID);
    },
    enabled: user !== undefined && postDetails !== undefined,
  });

  return (
    <Stack spacing={1.5} sx={{ paddingX: 2 }}>
      <Card sx={{ borderRadius: boxBorderRadius }}>
        <CardActionArea sx={{ borderRadius: 0 }}>
          <CardHeader
            avatar={
              <Avatar
                src={
                  postOwnerDetails &&
                  `http://localhost:3000/${postOwnerDetails.avatar}`
                }
              />
            }
            title={postOwnerDetails?.username}
          />
          <CardContent>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {postDetails?.content}
            </Typography>
          </CardContent>
          {postDetails?.media && (
            <CardMedia
              component="img"
              image={`http://localhost:3000/${postDetails.media}`}
              sx={{ padding: 2 }}
            />
          )}
        </CardActionArea>
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
    </Stack>
  );
};

export default Post;
