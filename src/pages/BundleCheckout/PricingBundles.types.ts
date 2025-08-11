// ملف وهمي للأنواع
export type BundleFeature = {
    key: { name: string } | null;
    value: string;
};

export type BundleApiDetails = {
    id: number;
    name: string;
    features: BundleFeature[];
};