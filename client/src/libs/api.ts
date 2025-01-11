import axios from "axios";

axios.defaults.withCredentials = true;

export type Post = {
  _id: string;
  userID: string;
  content: string;
  media: string | null | undefined;
};
export type Posts = Pick<Post, "_id">[];

type PostsFilters = {
  lastID?: Post["_id"];
  userID?: UserCredentials["_id"];
};

export const getPosts = async (filters: PostsFilters = {}) => {
  let getUrl = "http://localhost:3000/posts?limit=8";

  if (filters.lastID !== undefined) {
    getUrl += `&lastID=${filters.lastID}`;
  }

  if (filters.userID !== undefined) {
    getUrl += `&userID=${filters.userID}`;
  }

  const { data } = await axios.get<{ posts: Posts }>(getUrl);

  return data.posts;
};

export const getPostDetails = async (postID: Post["_id"]) => {
  const { data } = await axios.get<Post>(
    `http://localhost:3000/posts/${postID}`
  );

  return data;
};

export const postPost = async (
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
      },
    }
  );

  return data;
};

export const generatePostContent = async () => {
  const { data } = await axios.get<string>("http://localhost:3000/gemini");

  return data;
};

export const updatePost = async (
  postID: Post["_id"],
  content?: Post["content"],
  media?: File | null
) => {
  const formData = new FormData();

  if (content !== undefined) {
    formData.append("content", content);
  }

  if (media !== undefined) {
    if (media === null) {
      formData.append("removeMedia", "true");
    } else {
      formData.append("media", media);
    }
  }

  const { data } = await axios.put<Post>(
    `http://localhost:3000/posts/${postID}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const deletePost = async (postID: Post["_id"]) => {
  const { data } = await axios.delete<Post>(
    `http://localhost:3000/posts/${postID}`
  );

  return data;
};

export type Comment = {
  postID: Post["_id"];
  userID: UserCredentials["_id"];
  content: string;
  _id: string;
};
export type Comments = Pick<Comment, "_id">[];

type CommentFilters = {
  userID?: UserCredentials["_id"];
  notUserID?: UserCredentials["_id"];
  postID?: Post["_id"];
  lastID?: Comment["_id"];
  limit?: number;
};

export const getComments = async (filters: CommentFilters) => {
  let getUrl = "http://localhost:3000/comments";

  if (Object.keys(filters).length !== 0) {
    getUrl += "?";

    if (filters.userID !== undefined) {
      getUrl += `userID=${filters.userID}&`;
    }
    if (filters.notUserID !== undefined) {
      getUrl += `notUserID=${filters.notUserID}&`;
    }
    if (filters.postID !== undefined) {
      getUrl += `postID=${filters.postID}&`;
    }
    if (filters.lastID !== undefined) {
      getUrl += `lastID=${filters.lastID}&`;
    }
    if (filters.limit !== undefined) {
      getUrl += `limit=${filters.limit}&`;
    }
  }

  const { data } = await axios.get<{ comments: Comments }>(getUrl);

  return data.comments;
};

export const getCommentDetails = async (commentID: Comment["_id"]) => {
  const { data } = await axios.get<Comment>(
    `http://localhost:3000/comments/${commentID}`
  );

  return data;
};

export const getCommentCount = async (postID: Post["_id"]) => {
  const { data } = await axios.get<{ count: number }>(
    `http://localhost:3000/comments/count?postID=${postID}`
  );

  return data.count;
};

export const postComment = async (
  postID: Post["_id"],
  content: Comment["content"]
) => {
  const { data } = await axios.post<void>(`http://localhost:3000/comments`, {
    postID,
    content,
  });

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

export const getUserDetails = async (userID: UserCredentials["_id"]) => {
  const { data } = await axios.get<UserDetails>(
    `http://localhost:3000/users/${userID}`
  );

  return data;
};

export const register = async (
  username: UserDetails["username"],
  password: UserDetails["password"],
  email: UserDetails["email"],
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
  email: UserDetails["email"],
  password: UserDetails["password"]
) => {
  const { data } = await axios.post<UserCredentials>(
    "http://localhost:3000/users/login",
    { email, password },
    { headers: { "Content-Type": "application/json" } }
  );

  return data;
};

export const googleLogin = async (credential: string) => {
  const { data } = await axios.post<UserCredentials>(
    "http://localhost:3000/users/google-login",
    { credential },
    { headers: { "Content-Type": "application/json" } }
  );

  return data;
};

export const logout = async (refreshToken: UserCredentials["refreshToken"]) => {
  await axios.post<void>(
    "http://localhost:3000/users/logout",
    { refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );
};

export const refreshToken = async (
  refreshToken: UserCredentials["refreshToken"]
) => {
  const { data } = await axios.post<UserCredentials>(
    "http://localhost:3000/users/refresh-token",
    { refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );

  return data;
};

export const updateUser = async (
  username?: UserDetails["username"],
  avatar?: File
) => {
  const formData = new FormData();

  if (username !== undefined) {
    formData.append("username", username);
  }

  if (avatar !== undefined) {
    formData.append("avatar", avatar);
  }

  const { data } = await axios.put<UserDetails>(
    "http://localhost:3000/users",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const getLikeCount = async (postID: Post["_id"]) => {
  const { data } = await axios.get<{ count: number }>(
    `http://localhost:3000/likes/count/${postID}`
  );

  return data.count;
};

export const getIsLiked = async (postID: Post["_id"]) => {
  const { data } = await axios.get<{ liked: boolean }>(
    `http://localhost:3000/likes/${postID}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return data.liked;
};

export const likePost = async (postID: Post["_id"]) => {
  await axios.post<void>(`http://localhost:3000/likes/${postID}`);
};

export const unLikePost = async (postID: Post["_id"]) => {
  await axios.delete<void>(`http://localhost:3000/likes/${postID}`);
};
