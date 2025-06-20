import api from "./apiClient";

export const getExample = async () => {
    const res = await api.get("/api/example");
    return res.data;
};