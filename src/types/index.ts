// ملف وهمي للأنواع العامة
export type LaravelResponse<T> = {
    data: T;
    message?: string;
};