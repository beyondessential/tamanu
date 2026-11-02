import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getCurrentUser } from "../../store/auth";
import { useApi } from "../useApi";

export const useAdminUserPreferencesQuery = (queryOptions) => {
  const api = useApi();
  const currentUser = useSelector(getCurrentUser);

  return useQuery(
    ['adminUserPreferences', currentUser?.id],
    () => api.get(`admin/user/userPreferences`),
    // dedupes refetches from tables mounting during a page load, as the facility variant does
    { staleTime: 30_000, ...queryOptions },
  );
};
