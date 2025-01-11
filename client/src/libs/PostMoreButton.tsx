import MoreIcon from "@mui/icons-material/MoreVert";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  ClickAwayListener,
  Dialog,
  Grow,
  IconButton,
  IconButtonProps,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  TextField,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@libs/userContext";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  deletePost as deletePostApi,
  updatePost as updatePostApi,
  Post,
  UserDetails,
} from "@libs/api";
import { useRouter } from "@tanstack/react-router";
import { buttonBorderRadius } from "@libs/consts";
import RemoveMediaIcon from "@mui/icons-material/FolderDelete";
import AddMediaIcon from "@mui/icons-material/UploadFile";
import VisuallyHiddenInput from "@libs/VisuallyHiddenInput";

type PostMoreButtonProps = {
  postID: Post["_id"];
  content?: Post["content"];
  media?: Post["media"];
  avatar?: UserDetails["avatar"];
} & Omit<
  IconButtonProps,
  | "children"
  | "onClick"
  | "id"
  | "aria-controls"
  | "aria-expanded"
  | "aria-haspopup"
  | "ref"
>;

const PostMoreButton = (props: PostMoreButtonProps) => {
  const { postID, content, media, ...restButtonProps } = props;

  const { user } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const [mediaFile, setMediaFile] = useState<{
    file: File | null;
    url: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: deletePost } = useMutation({
    mutationFn: async ({ postID }: { postID: string }) => {
      return await deletePostApi(postID);
    },
  });

  const { mutate: updatePost } = useMutation({
    mutationFn: async ({
      postID,
      content,
      media,
    }: {
      postID: string;
      content?: string;
      media?: File | null;
    }) => {
      return await updatePostApi(postID, content, media);
    },
  });

  const handleMenuToggle = () => {
    setMenuOpen((oldMenuOpen) => !oldMenuOpen);
  };

  const handleCloseMenu = (event: Event | React.SyntheticEvent) => {
    if (
      menuAnchorRef.current &&
      menuAnchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setMenuOpen(false);
  };

  const handleDeleteClick = async (event: Event | React.SyntheticEvent) => {
    if (
      menuAnchorRef.current &&
      menuAnchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    if (user === null) {
      return;
    }

    await deletePost(
      { postID },
      {
        onSuccess: () => {
          setMenuOpen(false);
          router.history.back();
        },
      }
    );
  };

  const handleEditClick = (event: Event | React.SyntheticEvent) => {
    if (
      menuAnchorRef.current &&
      menuAnchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setMenuOpen(false);
    setEditDialogOpen(true);
    setEditableContent(content);
    if (media !== undefined && media !== null) {
      setMediaFile({ file: null, url: `http://localhost:3000/${media}` });
    } else {
      setMediaFile(null);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      setMenuOpen(false);
    } else if (event.key === "Escape") {
      setMenuOpen(false);
    }
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditableContent(undefined);
    removeMedia();
  };

  const handleEditableContentChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setEditableContent(event.target.value);
  };

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  const handleUploadMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null || event.target.files.length === 0) {
      return;
    }

    if (mediaFile !== null && mediaFile.file !== null) {
      URL.revokeObjectURL(mediaFile.url);
    }

    const file = event.target.files[0];
    const url = URL.createObjectURL(file);

    setMediaFile({ file, url });
  };

  const removeMedia = () => {
    if (mediaFile !== null && mediaFile.file !== null) {
      URL.revokeObjectURL(mediaFile.url);
    }

    setMediaFile(null);
  };

  const handleRemoveMediaClick = () => {
    removeMedia();
  };

  const handleSaveClick = async () => {
    if (user === null) {
      return;
    }

    let updatedMedia: File | undefined | null;

    if (mediaFile === null) {
      if (media !== undefined && media !== null) {
        updatedMedia = null;
      } else {
        updatedMedia = undefined;
      }
    } else {
      if (mediaFile.file !== null) {
        updatedMedia = mediaFile.file;
      } else {
        updatedMedia = undefined;
      }
    }

    await updatePost(
      {
        postID,
        content: editableContent,
        media: updatedMedia,
      },
      {
        onSuccess: () => {
          handleEditDialogClose();
          queryClient.invalidateQueries({ queryKey: ["postDetails", postID] });
        },
      }
    );
  };

  return (
    <>
      <IconButton
        ref={menuAnchorRef}
        id={`composition-button-${postID}`}
        aria-controls={menuOpen ? `composition-menu-${postID}` : undefined}
        aria-expanded={menuOpen ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleMenuToggle}
        {...restButtonProps}
      >
        <MoreIcon />
      </IconButton>
      <Popper
        open={menuOpen}
        anchorEl={menuAnchorRef.current}
        role={undefined}
        placement="bottom-start"
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom-start" ? "left top" : "left bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleCloseMenu}>
                <MenuList
                  autoFocusItem={menuOpen}
                  id={`composition-menu-${postID}`}
                  aria-labelledby={`composition-button-${postID}`}
                  onKeyDown={handleListKeyDown}
                >
                  <MenuItem onClick={handleEditClick}>Edit</MenuItem>
                  <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <Card>
          <CardHeader title="Edit" />
          <CardContent>
            <TextField
              slotProps={{ inputLabel: { shrink: true } }}
              label="content"
              multiline
              fullWidth
              value={editableContent}
              onChange={handleEditableContentChange}
            />
          </CardContent>
          {mediaFile && (
            <CardMedia
              component="img"
              image={mediaFile.url}
              sx={{ padding: 2 }}
            />
          )}
          <CardActions>
            <Stack
              direction="row"
              sx={{
                width: "100%",
                justifyContent: "space-between",
                padding: 1,
              }}
            >
              <Stack direction="row" sx={{ justifyContent: "flex-start" }}>
                <IconButton component="label" role={undefined} tabIndex={-1}>
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleUploadMediaChange}
                  />
                  <AddMediaIcon />
                </IconButton>
                {mediaFile && (
                  <IconButton onClick={handleRemoveMediaClick}>
                    <RemoveMediaIcon />
                  </IconButton>
                )}
              </Stack>
              <Button
                variant="contained"
                sx={{ textTransform: "none", borderRadius: buttonBorderRadius }}
                onClick={handleSaveClick}
              >
                Save
              </Button>
            </Stack>
          </CardActions>
        </Card>
      </Dialog>
    </>
  );
};

export default PostMoreButton;
