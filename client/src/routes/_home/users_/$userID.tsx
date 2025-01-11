import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  getPosts,
  getUserDetails,
  Posts,
  updateUser as updateUserApi,
} from "@libs/api";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Dialog,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { ChangeEvent, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Post from "@libs/Post";
import AddMediaIcon from "@mui/icons-material/UploadFile";
import { useUser } from "@libs/userContext";
import { buttonBorderRadius } from "@libs/consts";
import VisuallyHiddenInput from "@libs/VisuallyHiddenInput";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_home/users_/$userID")({
  component: RouteComponent,
  loader: async ({ params: { userID } }) => {
    try {
      const profileUser = await getUserDetails(userID);

      return { profileUser: { ...profileUser, userID } };
    } catch {
      throw notFound();
    }
  },
  staleTime: 1,
  gcTime: 1,
  preloadGcTime: 1,
  preloadStaleTime: 1,
});

function RouteComponent() {
  const { profileUser: _profileUser } = Route.useLoaderData();
  const queryClient = useQueryClient();

  const [profileUser, setProfileUser] = useState(_profileUser);
  const [posts, setPosts] = useState<Posts>([]);
  const [hasMore, setHasMore] = useState(true);

  const { user } = useUser();

  const theme = useTheme();

  const [editableUsername, setEditableUsername] = useState(
    profileUser.username
  );
  const [avatarFile, setAvatarFIle] = useState<{
    file: File | undefined;
    url: string;
  }>({ file: undefined, url: `http://localhost:3000/${profileUser.avatar}` });
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { mutate: updateUser } = useMutation({
    mutationFn: async ({
      username,
      avatar,
    }: {
      username?: string;
      avatar?: File | undefined;
    }) => {
      return await updateUserApi(username, avatar);
    },
  });

  const resetEditState = () => {
    setEditableUsername(profileUser.username);
    if (avatarFile.file) {
      URL.revokeObjectURL(avatarFile.url);
    }

    setAvatarFIle({
      file: undefined,
      url: `http://localhost:3000/${profileUser.avatar}`,
    });
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
    resetEditState();
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    resetEditState();
  };

  const handleEditableUsernameChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setEditableUsername(event.target.value);
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null || event.target.files.length === 0) {
      return;
    }

    if (avatarFile.file) {
      URL.revokeObjectURL(avatarFile.url);
    }

    const file = event.target.files[0];
    const url = URL.createObjectURL(file);

    setAvatarFIle({ file, url });
  };

  const handleSaveClick = async () => {
    if (user === null) {
      return;
    }

    await updateUser(
      {
        username: editableUsername,
        avatar: avatarFile.file,
      },
      {
        onSuccess: (data) => {
          setProfileUser((oldProfileUser) => ({
            ...oldProfileUser,
            avatar: data.avatar,
            username: data.username,
          }));
          resetEditState();
          setEditDialogOpen(false);
          queryClient.invalidateQueries({
            queryKey: ["userDetails", user._id],
          });
        },
      }
    );
  };

  useEffect(() => {
    getPosts({ userID: profileUser.userID }).then((newPosts) =>
      setPosts(newPosts)
    );
  }, [profileUser.userID]);

  const fetchMoreData = () => {
    const lastPost = posts.at(-1);

    if (lastPost === undefined) {
      return null;
    }

    getPosts({ lastID: lastPost._id, userID: profileUser.userID }).then(
      (newPosts) => {
        setHasMore(newPosts.length > 0);
        setPosts((oldPosts) => oldPosts.concat(newPosts));
      }
    );
  };

  return (
    <Stack marginTop={-2}>
      <Box>
        <Card>
          <CardMedia
            component="img"
            image={`http://localhost:3000/${profileUser.avatar}`}
            sx={{ maxHeight: 200 }}
          />
          <CardContent>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <Stack>
                <Typography variant="h4">{profileUser.username}</Typography>
                <Typography variant="subtitle1">{profileUser.email}</Typography>
              </Stack>
              {user?._id === profileUser.userID && (
                <Button
                  onClick={handleEditClick}
                  sx={{
                    textTransform: "none",
                    borderRadius: buttonBorderRadius,
                  }}
                >
                  Edit
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
      <Divider />
      <InfiniteScroll
        dataLength={posts.length}
        loader={<></>}
        hasMore={hasMore}
        next={fetchMoreData}
        style={{
          display: "flex",
          flexDirection: "column",
          paddingLeft: `calc(${theme.spacing()} * 2)`,
          paddingRight: `calc(${theme.spacing()} * 2)`,
          paddingTop: `calc(${theme.spacing()} * 2)`,
          gap: `calc(${theme.spacing()} * 1.5)`,
        }}
      >
        {posts.map((post) => (
          <Post key={post._id} postID={post._id} />
        ))}
      </InfiniteScroll>
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <Card>
          <CardHeader title="Edit" />
          <CardContent>
            <TextField
              value={editableUsername}
              slotProps={{ inputLabel: { shrink: true } }}
              label="username"
              onChange={handleEditableUsernameChange}
            />
          </CardContent>
          <CardMedia
            component="img"
            image={avatarFile.url}
            sx={{ paddingX: 2, maxHeight: 500 }}
          />
          <CardActions>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                width: "100%",
                paddingX: 1,
              }}
            >
              <IconButton component="label" role={undefined} tabIndex={-1}>
                <VisuallyHiddenInput
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleAvatarFileChange}
                />
                <AddMediaIcon />
              </IconButton>
              <Button
                onClick={handleSaveClick}
                variant="contained"
                sx={{ borderRadius: buttonBorderRadius, textTransform: "none" }}
              >
                Save
              </Button>
            </Stack>
          </CardActions>
        </Card>
      </Dialog>
    </Stack>
  );
}
