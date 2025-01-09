import MoreIcon from "@mui/icons-material/MoreVert";
import { IconButton, IconButtonProps, Menu, MenuItem } from "@mui/material";
import LikeIcon from "@mui/icons-material/Favorite";
import NotLikedIcon from "@mui/icons-material/FavoriteBorder";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@libs/userContext";
import axios from "axios";
import { useState } from "react";

type LikeButtonProps = {
  postID: string;
  delistPost: (postID: string) => void;
} & Omit<IconButtonProps, "children" | "onClick">;

const LikeButton = (props: LikeButtonProps) => {
  const { postID, ...restButtonProps } = props;

  const [menuOpen, setMenuOpen] = useState(false);

  const { user } = useUser();

  const queryClient = useQueryClient();

  const { data: likeCount } = useQuery({
    queryKey: ["likeCount", user, postID],
    queryFn: () => getLikeCount(user?.accessToken, postID),
    enabled: user !== undefined,
  });

  const { data: isLiked } = useQuery({
    queryKey: ["isLiked", user, postID],
    queryFn: () => getIsLiked(user?.accessToken, postID),
    enabled: user !== undefined,
  });

  const { mutate: likePost } = useMutation({
    mutationFn: async ({
      postID,
      accessToken,
    }: {
      postID: string;
      accessToken: string;
    }) => {
      const { data } = await axios.post<void>(
        `http://localhost:3000/likes/${postID}`,
        undefined,
        {
          headers: {
            Authorization: `JWT ${accessToken}`,
          },
        }
      );

      return data;
    },
  });

  const { mutate: unLikePost } = useMutation({
    mutationFn: async ({
      postID,
      accessToken,
    }: {
      postID: string;
      accessToken: string;
    }) => {
      const { data } = await axios.delete<void>(
        `http://localhost:3000/likes/${postID}`,
        {
          headers: {
            Authorization: `JWT ${accessToken}`,
          },
        }
      );

      return data;
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
    <>
      <IconButton
        id={`more-button-${postID}`}
        aria-controls={menuOpen ? `post-menu-${postID}` : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? "true" : undefined}
        {...restButtonProps}
      >
        <MoreIcon />
      </IconButton>
      <Menu
        id={`post-menu-${postID}`}
        open={menuOpen}
        MenuListProps={{
          "aria-labelledby": `more-button-${postID}`,
        }}
      >
        <MenuItem>Edit</MenuItem>
        <MenuItem color="error">Delete</MenuItem>
      </Menu>
    </>
  );
};

export default LikeButton;
