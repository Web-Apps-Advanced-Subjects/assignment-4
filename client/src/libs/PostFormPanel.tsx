import { ChangeEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Stack,
  StackProps,
  Typography,
  Card,
  CardMedia,
  CardActions,
  CardContent,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import RemoveMediaIcon from "@mui/icons-material/FolderDelete";
import AddMediaIcon from "@mui/icons-material/UploadFile";
import { LoadingButton } from "@mui/lab";

import useUser from "@libs/userContext/useUser";
import { boxBorderRadius, buttonBorderRadius } from "@libs/consts";
import VisuallyHiddenInput from "@libs/VisuallyHiddenInput";
import { generatePostContent, postPost as postPostApi } from "@libs/api";
import { useNavigate } from "@tanstack/react-router";
import Logo from "@assets/logo.svg?react";

type PostFormPanelProps = Omit<StackProps, "children">;

function PostFormPanel(props: PostFormPanelProps) {
  const { sx, ...restProps } = props;

  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<{
    file: File;
    url: string;
  } | null>(null);

  const { user } = useUser();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: postPost, isPending: isPostPostPending } = useMutation({
    mutationFn: async ({
      accessToken,
      content,
      media,
    }: {
      accessToken: string;
      content: string;
      media: File | undefined;
    }) => {
      return await postPostApi(accessToken, content, media);
    },
  });

  const { mutate: generateContent, isPending: isGenerating } = useMutation({
    mutationFn: async (accessToken: string) => {
      return await generatePostContent(accessToken);
    },
  });

  const handleContentChange = (event: ChangeEvent<HTMLInputElement>) => {
    setContent(event.target.value);
  };

  const handleUploadMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null || event.target.files.length === 0) {
      return;
    }

    if (mediaFile !== null) {
      URL.revokeObjectURL(mediaFile.url);
    }

    const file = event.target.files[0];
    const url = URL.createObjectURL(file);

    setMediaFile({ file, url });
  };

  const removeMedia = () => {
    if (mediaFile !== null) {
      URL.revokeObjectURL(mediaFile.url);

      setMediaFile(null);
    }
  };

  const handleRemoveMediaClick = () => {
    removeMedia();
  };

  const handlePostClick = async () => {
    if (content === "" || user === null) {
      return;
    }

    await postPost(
      {
        content,
        accessToken: user.accessToken,
        media: mediaFile?.file,
      },
      {
        onSuccess: (data) => {
          removeMedia();
          setContent("");
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          navigate({ to: "/posts/$postID", params: { postID: data._id } });
        },
      }
    );
  };

  const handleGenerateClick = async () => {
    if (user === null) {
      return;
    }

    await generateContent(user.accessToken, {
      onSuccess: (data) => setContent(data),
    });
  };

  return (
    <Stack
      sx={{
        alignItems: "flex-start",
        justifyContent: "flex-start",
        paddingX: 1,
        ...sx,
      }}
      {...restProps}
    >
      <Card sx={{ padding: 2, borderRadius: boxBorderRadius }}>
        <Typography variant="h5" sx={{ fontWeight: 700, padding: 2 }}>
          What's on your mind?
        </Typography>
        <CardContent sx={{ paddingY: 1, width: 360 }}>
          <Stack spacing={2} sx={{ width: "100%", alignItems: "flex-start" }}>
            <TextField
              label="content"
              multiline
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={content}
              onChange={handleContentChange}
            />
          </Stack>
        </CardContent>
        {mediaFile && (
          <CardMedia
            component="img"
            image={mediaFile.url}
            sx={{ paddingX: 2, maxHeight: 500 }}
          />
        )}

        <CardActions sx={{ paddingX: 2, width: 360 }}>
          <Stack
            direction="row"
            sx={{
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" sx={{ justifyContent: "flex-start" }}>
              <IconButton onClick={handleGenerateClick} disabled={isGenerating}>
                {isGenerating ? (
                  <CircularProgress size={24} />
                ) : (
                  <Logo width={24} height={24} />
                )}
              </IconButton>
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
            <LoadingButton
              variant="contained"
              sx={{ textTransform: "none", borderRadius: buttonBorderRadius }}
              loading={isPostPostPending}
              disabled={content === ""}
              onClick={handlePostClick}
            >
              Post
            </LoadingButton>
          </Stack>
        </CardActions>
      </Card>
    </Stack>
  );
}

export default PostFormPanel;
