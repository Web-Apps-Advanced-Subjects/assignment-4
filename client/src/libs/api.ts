import axios from "axios";

export type Posts = { _id: string }[];

export type Post = {
  _id: string;
  userID: string;
  content: string;
  media?: string;
};

export const getPosts = async (
  accessToken: UserCredentials["accessToken"],
  lastPostID: Post["_id"] | null
) => {
  let getUrl = "http://localhost:3000/posts?limit=5";

  console.log('getting posts')

  if (lastPostID !== null) {
    getUrl += `&lastID=${lastPostID}`;
  }

  const { data } = await axios.get<{ posts: Posts }>(getUrl, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `JWT ${accessToken}`,
    },
  });

  return data.posts;
};

export const getPostDetails = async (
  accessToken: UserCredentials["accessToken"],
  postID: Post["_id"]
) => {
  const { data } = await axios.get<Post>(
    `http://localhost:3000/posts/${postID}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${accessToken}`,
      },
    }
  );

  return data;
};

export const postPost = async (
  accessToken: UserCredentials["accessToken"],
  content: Post["content"],
  media: File | undefined
) => {
  const formData = new FormData();

  formData.append("content", content);

  if (media !== undefined) {
    formData.append("media", media);
  }

  const { data } = await axios.post<{ _id: string }>(
    "http://localhost:3000/posts",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `JWT ${accessToken}`,
      },
    }
  );

  return data;
};

export const getCommentCount = async (
  accessToken: UserCredentials["accessToken"],
  postID: Post["_id"]
) => {
  const { data } = await axios.get<{ count: number }>(
    `http://localhost:3000/comments/count?postID=${postID}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${accessToken}`,
      },
    }
  );

  return data.count;
};

export const postComment = async (
  accessToken: UserCredentials["accessToken"],
  postID: Post["_id"],
  content: Post["content"]
) => {
  const { data } = await axios.post<void>(
    `http://localhost:3000/comments`,
    { postID, content },
    {
      headers: {
        Authorization: `JWT ${accessToken}`,
      },
    }
  );

  return data;
};

export type UserCredentials = {
  _id: string;
  accessToken: string;
  refreshToken: string;
};

export type UserDetails = {
  username: string;
  password: string;
  avatar: string;
  email: string;
};

export type User = UserCredentials & UserDetails;

export const getUserDetails = async (
  accessToken: UserCredentials["accessToken"],
  userID: UserCredentials["_id"]
) => {
  const { data } = await axios.get<UserDetails>(
    `http://localhost:3000/users/${userID}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${accessToken}`,
      },
    }
  );

  return data;
};

export const register = async (
  username: UserDetails['username'],
  password: UserDetails['password'],
  email: UserDetails['email'],
  avatar: File
) => {
  const formData = new FormData();

  formData.append("username", username);
  formData.append("password", password);
  formData.append("email", email);
  formData.append("avatar", avatar);

  const { data } = await axios.post<UserCredentials>(
    "http://localhost:3000/users/register",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
};

export const login = async (
  username: UserDetails["username"],
  password: UserDetails["password"]
) => {
  const { data } = await axios.post<UserCredentials>(
    "http://localhost:3000/users/login",
    { username, password },
    { headers: { "Content-Type": "application/json" } }
  );

  return data;
};

export const logout = async (refreshToken: UserCredentials["accessToken"]) => {
  await axios.post<void>(
    "http://localhost:3000/users/logout",
    { refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );
};

export const getLikeCount = async (
  accessToken: UserCredentials["accessToken"],
  postID: Post["_id"]
) => {
  const { data } = await axios.get<{ count: number }>(
    `http://localhost:3000/likes/count/${postID}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${accessToken}`,
      },
    }
  );

  return data.count;
};

export const getIsLiked = async (
  accessToken: UserCredentials["accessToken"],
  postID: Post["_id"]
) => {
  const { data } = await axios.get<{ liked: boolean }>(
    `http://localhost:3000/likes/${postID}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${accessToken}`,
      },
    }
  );

  return data.liked;
};

export const likePost = async (
  accessToken: UserCredentials["accessToken"],
  postID: Post["_id"]
) => {
  await axios.post<void>(`http://localhost:3000/likes/${postID}`, undefined, {
    headers: {
      Authorization: `JWT ${accessToken}`,
    },
  });
};

export const unLikePost = async (
  accessToken: UserCredentials["accessToken"],
  postID: Post["_id"]
) => {
  await axios.delete<void>(`http://localhost:3000/likes/${postID}`, {
    headers: {
      Authorization: `JWT ${accessToken}`,
    },
  });
};
