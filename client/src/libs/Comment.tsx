import { Avatar, Card, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { boxBorderRadius } from "@libs/consts";
import {
  getUserDetails,
  type Comment as CommentApi,
  getCommentDetails,
} from "@libs/api";

type CommentProps = {
  commentID: CommentApi["_id"];
};

const Comment = (props: CommentProps) => {
  const { commentID } = props;

  const { data: commentDetails } = useQuery({
    queryKey: [commentID],
    queryFn: () => {
      return getCommentDetails(commentID);
    },
  });

  const { data: commentOwnerDetails } = useQuery({
    queryKey: ["userDetails", commentDetails?.userID],
    queryFn: () => {
      if (commentDetails?.userID === undefined) {
        throw new Error("should never be called with unknown user");
      }

      return getUserDetails(commentDetails.userID);
    },
    enabled: commentDetails?.userID !== undefined,
  });

  return (
    <Card sx={{ borderRadius: boxBorderRadius, padding: 2 }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "flex-start" }}
        spacing={1}
      >
        <Avatar
          src={
            commentOwnerDetails?.avatar &&
            `http://localhost:3000/${commentOwnerDetails.avatar}`
          }
        />
        <Stack spacing={1} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {commentOwnerDetails?.username}
          </Typography>
          <Typography
            sx={{
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              color: "text.secondary",
            }}
            variant="body2"
          >
            {commentDetails?.content}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
};

export default Comment;
