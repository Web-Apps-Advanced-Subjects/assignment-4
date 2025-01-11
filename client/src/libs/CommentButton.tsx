import {
  Avatar,
  Box,
  Button,
  ButtonProps,
  Card,
  CardActions,
  CardContent,
  Dialog,
  Grid2 as Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@libs/userContext";
import { buttonBorderRadius } from "@libs/consts";
import { ChangeEvent, useState } from "react";
import {
  getCommentCount,
  getUserDetails,
  Post,
  postComment as postCommentApi,
} from "@libs/api";

type CommentButtonProps = {
  postID: Post["_id"];
  userID: Post["userID"];
  content: Post["content"];
} & Omit<ButtonProps, "children" | "onClick">;

const CommentButton = (props: CommentButtonProps) => {
  const { postID, userID, content, ...restButtonProps } = props;

  const [reply, setReply] = useState("");
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  const { user } = useUser();

  const queryClient = useQueryClient();

  const { data: commentOwnerDetails } = useQuery({
    queryKey: ['userDetails', userID],
    queryFn: () => {
      return getUserDetails(userID);
    },
  });

  const { data: commentCount } = useQuery({
    queryKey: ["commentCount", postID],
    queryFn: () => {
      return getCommentCount(postID);
    },
  });

  const { mutate: postComment } = useMutation({
    mutationFn: async ({
      postID,
      content,
    }: {
      postID: Post["_id"];
      content: string;
    }) => {
      return await postCommentApi(postID, content);
    },
  });

  const handleReplyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReply(event.target.value);
  };

  const handleCommentClick = () => {
    setCommentDialogOpen(true);
  };

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
  };

  const handleReplyClick = async () => {
    if (user === null) {
      return;
    }

    await postComment(
      {
        postID,
        content: reply,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["commentCount", postID],
          });
          queryClient.invalidateQueries({
            queryKey: ["comments", user, postID],
          });
          setReply("");
          setCommentDialogOpen(false);
        },
      }
    );
  };

  return (
    <>
      <Button
        startIcon={<CommentIcon />}
        color="info"
        {...restButtonProps}
        onClick={handleCommentClick}
      >
        {commentCount}
      </Button>
      <Dialog open={commentDialogOpen} onClose={handleCommentDialogClose}>
        <Card variant="outlined" sx={{ padding: 2, minWidth: 550 }}>
          <CardContent>
            <Stack spacing={2}>
              <Grid container spacing={1}>
                <Grid size={2}>
                  <Stack
                    spacing={2}
                    sx={{
                      height: "100%",
                      alignItems: "center",
                    }}
                  >
                    <Avatar
                      src={
                        commentOwnerDetails &&
                        `http://localhost:3000/${commentOwnerDetails.avatar}`
                      }
                    />
                    <Box
                      sx={{
                        background:
                          "linear-gradient(#aaa, #aaa) no-repeat center/2px 100%;",
                        height: "100%",
                        width: "100%",
                      }}
                    />
                  </Stack>
                </Grid>
                <Grid size={10}>
                  <Stack spacing={2}>
                    <Typography>{commentOwnerDetails?.username}</Typography>
                    <Typography>{content}</Typography>
                  </Stack>
                </Grid>
              </Grid>
              <Grid container spacing={1}>
                <Grid size={2}>
                  <Stack sx={{ alignItems: "center" }}>
                    <Avatar
                      src={
                        user !== null
                          ? `http://localhost:3000/${user.avatar}`
                          : undefined
                      }
                    />
                  </Stack>
                </Grid>
                <Grid size={10}>
                  <Stack spacing={2}>
                    <Typography>{user?.username}</Typography>
                    <TextField
                      label="Post your reply"
                      multiline
                      focused
                      autoFocus
                      variant="standard"
                      slotProps={{
                        input: {
                          disableUnderline: true,
                        },
                      }}
                      value={reply}
                      onChange={handleReplyChange}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
          <CardActions>
            <Stack
              sx={{ width: "100%", justifyContent: "flex-end" }}
              direction="row"
            >
              <Button
                variant="contained"
                disabled={reply === ""}
                onClick={handleReplyClick}
                sx={{ borderRadius: buttonBorderRadius, textTransform: "none" }}
              >
                Reply
              </Button>
            </Stack>
          </CardActions>
        </Card>
      </Dialog>
    </>
  );
};

export default CommentButton;
