import { Button, ButtonProps } from "@mui/material";
import LikeIcon from "@mui/icons-material/Favorite";
import NotLikedIcon from "@mui/icons-material/FavoriteBorder";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@libs/userContext";
import {
  getIsLiked,
  getLikeCount,
  likePost as likePostApi,
  Post,
  unLikePost as unLikePostApi,
} from "@libs/api";

type LikeButtonProps = {
  postID: Post["_id"];
} & Omit<ButtonProps, "children" | "color" | "startIcon" | "onClick">;

const LikeButton = (props: LikeButtonProps) => {
  const { postID, ...restButtonProps } = props;

  const { user } = useUser();

  const queryClient = useQueryClient();

  const { data: likeCount } = useQuery({
    queryKey: ["likeCount", postID],
    queryFn: () => {
      return getLikeCount(postID);
    },
  });

  const { data: isLiked } = useQuery({
    queryKey: ["isLiked", user?._id, postID],
    queryFn: () => {
      return getIsLiked(postID);
    },
  });

  const { mutate: likePost } = useMutation({
    mutationFn: async ({ postID }: { postID: Post["_id"] }) => {
      await likePostApi(postID);
    },
  });

  const { mutate: unLikePost } = useMutation({
    mutationFn: async ({ postID }: { postID: Post["_id"] }) => {
      await unLikePostApi(postID);
    },
  });

  const handleLikeClick = async () => {
    if (user === null || isLiked === undefined) {
      return;
    }

    let clickFunc: typeof likePost | typeof unLikePost;

    if (isLiked) {
      clickFunc = unLikePost;
    } else {
      clickFunc = likePost;
    }

    await clickFunc(
      { postID },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["likeCount", postID],
          });
          queryClient.invalidateQueries({
            queryKey: ["isLiked", user._id, postID],
          });
        },
      }
    );
  };

  return (
    <Button
      startIcon={isLiked ? <LikeIcon /> : <NotLikedIcon />}
      color="error"
      onClick={handleLikeClick}
      {...restButtonProps}
    >
      {likeCount}
    </Button>
  );
};

export default LikeButton;
