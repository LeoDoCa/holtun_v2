import axios from "axios";

// ─── Cliente base ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8088/api/";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("holtun_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) localStorage.removeItem("holtun_token");
    return Promise.reject(error);
  }
);

// ─── Helper para URLs de imágenes ─────────────────────────────────────────────

export const fileUrl = (path: string): string => {
  if (path.startsWith("http")) return path;
  const relative = path.replace(/^\/uploads\//, "");
  return `${BASE_URL}files/${relative}`;
};

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CategoryDto {
  uuid: string;
  name: string;
  description?: string;
  image?: string;
  productCount?: number;
}

export interface ProductDto {
  uuid: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categories: CategoryDto[];
  images: string[];
}

export interface ProductFilterParams {
  name?: string;
  categoryUuid?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minStock?: number;
  page?: number;
  size?: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  name: string;
  lastName: string;
  username: string;
  role: string;
  accessToken: string;
}

export interface UserDto {
  uuid: string;
  username: string;
  role: "ADMIN" | "STAFF";
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authService = {
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    const { data } = await client.post<AuthResponse>("/auth/login", credentials, {
      headers: { "Content-Type": "application/json" },
    });
    localStorage.setItem("holtun_token", data.accessToken);
    return data;
  },

  async logout(): Promise<void> {
    await client.post("/auth/logout").catch(() => {});
    localStorage.removeItem("holtun_token");
  },

  async validateToken(token: string): Promise<AuthResponse> {
    const { data } = await client.get<AuthResponse>("/auth/validate-token", {
      params: { token },
    });
    return data;
  },
};

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export const userService = {
  async getByUuid(uuid: string): Promise<UserDto> {
    const { data } = await client.get<UserDto>(`/users/${uuid}`);
    return data;
  },
};

// ─── Productos ────────────────────────────────────────────────────────────────

export const productService = {
  async getAll(): Promise<ProductDto[]> {
    const { data } = await client.get<ProductDto[]>("/products");
    return data;
  },

  async getFiltered(params: ProductFilterParams): Promise<PagedResponse<ProductDto>> {
    const { data } = await client.get<PagedResponse<ProductDto>>("/products/filter", {
      params: {
        name: params.name,
        categoryUuid: params.categoryUuid,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        inStock: params.inStock,
        minStock: params.minStock,
        page: params.page ?? 0,
        size: params.size ?? 12,
        sort: "name",
      },
    });
    return data;
  },

  async getByUuid(uuid: string): Promise<ProductDto> {
    const { data } = await client.get<ProductDto>(`/products/${uuid}`);
    return data;
  },

  async create(payload: {
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryUuids: string[];
    images: File[];
  }): Promise<ProductDto> {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("description", payload.description);
    form.append("price", String(payload.price));
    form.append("stock", String(payload.stock));
    payload.categoryUuids.forEach((uuid) => form.append("categoryUuids", uuid));
    payload.images.forEach((file) => form.append("images", file));
    const { data } = await client.post<ProductDto>("/products", form);
    return data;
  },

  async update(uuid: string, payload: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryUuids?: string[];
    images?: File[];
    existingImagePaths?: string[];
  }): Promise<ProductDto> {
    const form = new FormData();
    if (payload.name !== undefined) form.append("name", payload.name);
    if (payload.description !== undefined) form.append("description", payload.description);
    if (payload.price !== undefined) form.append("price", String(payload.price));
    if (payload.stock !== undefined) form.append("stock", String(payload.stock));
    payload.categoryUuids?.forEach((id) => form.append("categoryUuids", id));
    payload.images?.forEach((file) => form.append("images", file));
    payload.existingImagePaths?.forEach((path) => form.append("existingImages", path));
    const { data } = await client.put<ProductDto>(`/products/${uuid}`, form);
    return data;
  },

  async delete(uuid: string): Promise<void> {
    await client.delete(`/products/${uuid}`);
  },
};

// ─── Categorías ───────────────────────────────────────────────────────────────

export const categoryService = {
  async getAll(): Promise<CategoryDto[]> {
    const { data } = await client.get<CategoryDto[]>("/categories");
    return data;
  },

  async getByUuid(uuid: string): Promise<CategoryDto> {
    const { data } = await client.get<CategoryDto>(`/categories/${uuid}`);
    return data;
  },

  async create(payload: {
    name: string;
    description?: string;
    image: File;
  }): Promise<CategoryDto> {
    const form = new FormData();
    form.append("name", payload.name);
    if (payload.description) form.append("description", payload.description);
    form.append("image", payload.image);
    const { data } = await client.post<CategoryDto>("/categories", form);
    return data;
  },

  async update(uuid: string, payload: {
    name?: string;
    description?: string;
    image?: File;
    existingImage?: string; 
  }): Promise<CategoryDto> {
    const form = new FormData();
    if (payload.name !== undefined) form.append("name", payload.name);
    if (payload.description !== undefined) form.append("description", payload.description);
    if (payload.image) form.append("image", payload.image);
    if (payload.existingImage) form.append("existingImage", payload.existingImage); // ← nuevo
    const { data } = await client.put<CategoryDto>(`/categories/${uuid}`, form);
    return data;
  },

  async delete(uuid: string): Promise<void> {
    await client.delete(`/categories/${uuid}`);
  },
};

// ─── Archivos ─────────────────────────────────────────────────────────────────

export const fileService = {
  getUrl: (entityUuid: string, filename: string): string =>
    `${BASE_URL}files/${entityUuid}/${filename}`,
};

export default client;
