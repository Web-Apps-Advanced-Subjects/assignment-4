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
  UserCredentials,
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
    queryKey: ["likeCount", user, postID],
    queryFn: () => {
      if (user === null) {
        throw new Error("should never be called with unknown user");
      }

      return getLikeCount(user.accessToken, postID);
    },
    enabled: user !== undefined,
  });

  const { data: isLiked } = useQuery({
    queryKey: ["isLiked", user, postID],
    queryFn: () => {
      if (user === null) {
        throw new Error("should never be called with unknown user");
      }

      return getIsLiked(user.accessToken, postID);
    },
    enabled: user !== undefined,
  });

  const { mutate: likePost } = useMutation({
    mutationFn: async ({
      accessToken,
      postID,
    }: {
      accessToken: UserCredentials["accessToken"];
      postID: Post["_id"];
    }) => {
      await likePostApi(accessToken, postID);
    },
  });

  const { mutate: unLikePost } = useMutation({
    mutationFn: async ({
      postID,
      accessToken,
    }: {
      accessToken: UserCredentials["accessToken"];
      postID: Post["_id"];
    }) => {
      await unLikePostApi(accessToken, postID);
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
      { postID, accessToken: user.accessToken },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["likeCount", user, postID],
          });
          queryClient.invalidateQueries({
            queryKey: ["isLiked", user, postID],
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
