import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/Auth";
import { useApi } from "../useApi";

export const useAdminUserPreferencesQuery = (queryOptions) => {
  const api = useApi();
  const { currentUser } = useAuth();

  return useQuery(
    ['adminUserPreferences', currentUser?.id],
    () => api.get(`admin/user/userPreferences`),
    queryOptions,
  );
};
