export interface Link {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  headline: string;
  avatar?: string;
  email?: string;
  location?: string;
  intro: string; // short line shown on home
  about: string; // markdown body shown on /resume
  skills: string[];
  links: Link[];
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string; // markdown
  tech: string[];
  url?: string;
  repo?: string;
  image?: string;
  year?: string;
  status?: "active" | "archived" | "wip";
  featured?: boolean;
  /** 是否在前台作品页展示（后台显隐开关）。默认 true。 */
  visible?: boolean;
}

export interface Post {
  slug: string;
  title: string;
  summary: string;
  body: string; // markdown
  date: string; // ISO yyyy-mm-dd
  updated?: string;
  tags: string[];
  published: boolean;
  /** 是否精选（前台置顶展示）。默认 false。 */
  featured?: boolean;
}

export interface ContentRepo {
  readProfile(): Promise<Profile>;
  writeProfile(p: Profile): Promise<void>;
  listProjects(): Promise<Project[]>;
  readProject(slug: string): Promise<Project | null>;
  writeProject(p: Project): Promise<void>;
  deleteProject(slug: string): Promise<void>;
  /** 切换某个作品是否在前台显示。 */
  setProjectVisible(slug: string, visible: boolean): Promise<void>;
  /** 设置某个作品是否为精选（显示在首页）。 */
  setProjectFeatured(slug: string, featured: boolean): Promise<void>;
  /** 调整作品展示顺序（在当前位置上移/下移一格）。 */
  moveProject(slug: string, dir: "up" | "down"): Promise<void>;
  /** 按传入的顺序整体重排作品（拖拽排序后调用）。 */
  reorderProjects(order: string[]): Promise<void>;
  listPosts(opts?: { onlyPublished?: boolean }): Promise<Post[]>;
  readPost(slug: string): Promise<Post | null>;
  writePost(p: Post): Promise<void>;
  deletePost(slug: string): Promise<void>;
  /** 设置某篇文章是否为精选。 */
  setPostFeatured(slug: string, featured: boolean): Promise<void>;
  /** 按传入顺序整体重排文章（拖拽排序后调用）。 */
  reorderPosts(order: string[]): Promise<void>;
}
