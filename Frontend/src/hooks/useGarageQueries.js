import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { queryKeys } from '../queryKeys';
import { getRequiredDataForPath } from '../routes';

const REFETCH_INTERVAL = 30_000;

const defaultStats = {
  totalCustomers: 0,
  totalVehicles: 0,
  totalInventoryValue: 0,
  todayRevenue: 0,
  todayExpenses: 0,
  todayProfit: 0,
  pendingJobs: 0,
  completedJobs: 0,
  approvalRequests: 0,
};

const queryOptions = (key, endpoint, enabled, needsData) => ({
  queryKey: key,
  queryFn: () => api.get(endpoint),
  enabled: enabled && needsData,
  staleTime: 15_000,
  refetchInterval: needsData ? REFETCH_INTERVAL : false,
});

function upsertById(list, item, idKey = 'id') {
  const index = list.findIndex((entry) => entry[idKey] === item[idKey]);
  if (index < 0) return [...list, item];
  const next = [...list];
  next[index] = item;
  return next;
}

function patchListCache(queryClient, key, updater) {
  queryClient.setQueryData(key, (old) => updater(Array.isArray(old) ? old : []));
}

async function syncInventoryCache(queryClient, updater) {
  const key = queryKeys.inventory();
  await queryClient.cancelQueries({ queryKey: key });
  patchListCache(queryClient, key, updater);
}

function replaceListCache(queryClient, key, list) {
  queryClient.setQueryData(key, list);
}

function bumpStats(queryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.stats(), refetchType: 'active' });
}

export function useDashboardFinancialStats({ metric = 'all', mode = 'today', from = '', to = '' } = {}) {
  const enabled = mode !== 'custom' || Boolean(from && to);
  return useQuery({
    queryKey: [...queryKeys.stats(), 'financial', metric, mode, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (mode === 'overall') params.set('range', 'overall');
      else if (mode === 'custom' && from && to) {
        params.set('from', from);
        params.set('to', to);
      }
      const q = params.toString();
      return api.get(`/api/dashboard/stats${q ? `?${q}` : ''}`);
    },
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useGarageQueries(enabled, pathname = '/dashboard') {
  const required = getRequiredDataForPath(pathname);
  const needs = (name) => required.has(name);

  const inventory = useQuery({
    ...queryOptions(queryKeys.inventory(), '/api/inventory', enabled, needs('inventory')),
    refetchInterval: false,
  });
  const customers = useQuery(queryOptions(queryKeys.customers(), '/api/customers', enabled, needs('customers')));
  const estimates = useQuery(queryOptions(queryKeys.estimates(), '/api/estimates', enabled, needs('estimates')));
  const jobs = useQuery(queryOptions(queryKeys.jobs(), '/api/jobs', enabled, needs('jobs')));
  const expenses = useQuery(queryOptions(queryKeys.expenses(), '/api/expenses', enabled, needs('expenses')));
  const investors = useQuery(queryOptions(queryKeys.investors(), '/api/investors', enabled, needs('investors')));
  const technicians = useQuery(queryOptions(queryKeys.technicians(), '/api/technicians', enabled, needs('technicians')));
  const notifications = useQuery(queryOptions(queryKeys.notifications(), '/api/notifications', enabled, needs('notifications')));
  const approvals = useQuery(queryOptions(queryKeys.approvals(), '/api/approvals', enabled, needs('approvals')));
  const stats = useQuery(queryOptions(queryKeys.stats(), '/api/dashboard/stats', enabled, needs('stats')));

  const queryEntries = [
    ['inventory', inventory],
    ['customers', customers],
    ['estimates', estimates],
    ['jobs', jobs],
    ['expenses', expenses],
    ['investors', investors],
    ['technicians', technicians],
    ['notifications', notifications],
    ['approvals', approvals],
    ['stats', stats],
  ];

  return {
    products: inventory.data ?? [],
    customers: customers.data ?? [],
    estimates: estimates.data ?? [],
    jobs: jobs.data ?? [],
    expenses: expenses.data ?? [],
    investors: investors.data ?? [],
    technicians: technicians.data ?? [],
    notifications: notifications.data ?? [],
    approvals: approvals.data ?? [],
    stats: stats.data ?? defaultStats,
    isInitialLoading: queryEntries.some(([name, q]) => required.has(name) && q.isLoading),
    dataUpdatedAt: Math.max(...queryEntries.map(([, q]) => q.dataUpdatedAt || 0)),
    isFetching: queryEntries.some(([, q]) => q.isFetching),
  };
}

export function useCustomerProfile(customerId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.customerProfile(customerId),
    queryFn: () => api.get(`/api/customers/${customerId}/profile`),
    enabled: Boolean(customerId) && enabled,
    staleTime: 10_000,
  });
}

export function useUsersQuery({ page = 1, limit = 15, search = '', enabled = true } = {}) {
  return useQuery({
    queryKey: [...queryKeys.users(), page, limit, search],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search ? { search } : {}),
      });
      return api.get(`/api/users?${params}`);
    },
    enabled,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useGarageMutations() {
  const queryClient = useQueryClient();

  const invalidate = (...keys) => {
    keys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key, refetchType: 'active' });
    });
  };

  const invalidateApprovals = () => invalidate(queryKeys.approvals(), queryKeys.stats());
  const invalidateNotifications = () => invalidate(queryKeys.notifications());
  const invalidateUsers = () => invalidate(queryKeys.users());

  const addProduct = useMutation({
    mutationFn: async (p) => {
      const data = await api.post('/api/inventory', p);
      if (data?.product) {
        await syncInventoryCache(queryClient, (list) => upsertById(list, data.product));
      } else {
        await queryClient.refetchQueries({ queryKey: queryKeys.inventory(), type: 'active' });
      }
      bumpStats(queryClient);
      return data;
    },
  });
  const editProduct = useMutation({
    mutationFn: async ({ id, updates }) => {
      const data = await api.put(`/api/inventory/${id}`, updates);
      if (data?.product) {
        await syncInventoryCache(queryClient, (list) => upsertById(list, data.product));
      } else {
        await queryClient.refetchQueries({ queryKey: queryKeys.inventory(), type: 'active' });
      }
      bumpStats(queryClient);
      return data;
    },
  });
  const deleteProduct = useMutation({
    mutationFn: async (id) => {
      const data = await api.delete(`/api/inventory/${id}`);
      await syncInventoryCache(queryClient, (list) => list.filter((item) => item.id !== id));
      bumpStats(queryClient);
      return data;
    },
  });
  const addCustomer = useMutation({
    mutationFn: async (cust) => {
      const customer = await api.post('/api/customers', cust);
      patchListCache(queryClient, queryKeys.customers(), (list) => upsertById(list, customer));
      bumpStats(queryClient);
      return customer;
    },
  });
  const editCustomer = useMutation({
    mutationFn: async ({ id, updates }) => {
      const customer = await api.put(`/api/customers/${id}`, updates);
      patchListCache(queryClient, queryKeys.customers(), (list) => upsertById(list, customer));
      bumpStats(queryClient);
      return customer;
    },
  });
  const deleteCustomer = useMutation({
    mutationFn: async (id) => {
      const data = await api.delete(`/api/customers/${id}`);
      patchListCache(queryClient, queryKeys.customers(), (list) => list.filter((item) => item.id !== id));
      bumpStats(queryClient);
      return data;
    },
  });
  const addCustomerCar = useMutation({
    mutationFn: async ({ customerId, data }) => {
      const result = await api.post(`/api/customers/${customerId}/cars`, data);
      if (result?.customer) {
        patchListCache(queryClient, queryKeys.customers(), (list) => upsertById(list, result.customer));
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.customerProfile(customerId) });
      return result;
    },
  });
  const createEstimate = useMutation({
    mutationFn: async (est) => {
      const estimate = await api.post('/api/estimates', est);
      patchListCache(queryClient, queryKeys.estimates(), (list) => upsertById(list, estimate));
      queryClient.invalidateQueries({ queryKey: queryKeys.customers() });
      if (estimate?.customerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customerProfile(estimate.customerId) });
      }
      bumpStats(queryClient);
      return estimate;
    },
  });
  const updateEstimate = useMutation({
    mutationFn: async ({ id, updates }) => {
      const result = await api.put(`/api/estimates/${id}`, updates);
      const { syncedJobs = [], ...estimate } = result;
      patchListCache(queryClient, queryKeys.estimates(), (list) => upsertById(list, estimate));
      if (syncedJobs.length) {
        patchListCache(queryClient, queryKeys.jobs(), (list) => {
          let next = list;
          for (const job of syncedJobs) {
            next = upsertById(next, job);
          }
          return next;
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.customers() });
      if (estimate?.customerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.customerProfile(estimate.customerId) });
      }
      bumpStats(queryClient);
      return { estimate, syncedJobCount: syncedJobs.length };
    },
  });
  const deleteEstimate = useMutation({
    mutationFn: async (id) => {
      const data = await api.delete(`/api/estimates/${id}`);
      patchListCache(queryClient, queryKeys.estimates(), (list) => list.filter((item) => item.id !== id));
      bumpStats(queryClient);
      return data;
    },
  });
  const convertToJob = useMutation({
    mutationFn: async ({ id, technicianName }) => {
      const newJob = await api.post(`/api/estimates/${id}/convert`, {
        assignedTechnician: technicianName,
      });
      patchListCache(queryClient, queryKeys.estimates(), (list) =>
        list.map((est) => (est.id === id ? { ...est, status: 'CONVERTED' } : est)),
      );
      patchListCache(queryClient, queryKeys.jobs(), (list) => upsertById(list, newJob));
      queryClient.invalidateQueries({ queryKey: queryKeys.customers() });
      bumpStats(queryClient);
      return newJob;
    },
  });
  const updateJobStatus = useMutation({
    mutationFn: async ({ id, updates }) => {
      const job = await api.put(`/api/jobs/${id}`, updates);
      patchListCache(queryClient, queryKeys.jobs(), (list) => upsertById(list, job));
      queryClient.invalidateQueries({ queryKey: queryKeys.customers() });
      bumpStats(queryClient);
      return job;
    },
  });
  const deleteJob = useMutation({
    mutationFn: async (id) => {
      const data = await api.delete(`/api/jobs/${id}`);
      patchListCache(queryClient, queryKeys.jobs(), (list) => list.filter((item) => item.id !== id));
      bumpStats(queryClient);
      return data;
    },
  });
  const addExpense = useMutation({
    mutationFn: async (exp) => {
      const expense = await api.post('/api/expenses', exp);
      patchListCache(queryClient, queryKeys.expenses(), (list) => upsertById(list, expense));
      bumpStats(queryClient);
      return expense;
    },
  });
  const deleteExpense = useMutation({
    mutationFn: async (id) => {
      const data = await api.delete(`/api/expenses/${id}`);
      patchListCache(queryClient, queryKeys.expenses(), (list) => list.filter((item) => item.id !== id));
      bumpStats(queryClient);
      return data;
    },
  });
  const updateExpense = useMutation({
    mutationFn: async ({ id, updates }) => {
      const expense = await api.put(`/api/expenses/${id}`, updates);
      patchListCache(queryClient, queryKeys.expenses(), (list) => upsertById(list, expense));
      bumpStats(queryClient);
      return expense;
    },
  });
  const addInvestor = useMutation({
    mutationFn: async (data) => {
      const investor = await api.post('/api/investors', data);
      patchListCache(queryClient, queryKeys.investors(), (list) => upsertById(list, investor));
      return investor;
    },
  });
  const updateInvestor = useMutation({
    mutationFn: async ({ id, updates }) => {
      const investor = await api.put(`/api/investors/${id}`, updates);
      patchListCache(queryClient, queryKeys.investors(), (list) => upsertById(list, investor));
      return investor;
    },
  });
  const deleteInvestor = useMutation({
    mutationFn: async (id) => {
      const data = await api.delete(`/api/investors/${id}`);
      patchListCache(queryClient, queryKeys.investors(), (list) => list.filter((item) => item.id !== id));
      return data;
    },
  });
  const addInvestorCar = useMutation({
    mutationFn: async ({ investorId, data }) => {
      const result = await api.post(`/api/investors/${investorId}/cars`, data);
      if (result?.investor) {
        patchListCache(queryClient, queryKeys.investors(), (list) => upsertById(list, result.investor));
      }
      return result;
    },
  });
  const updateInvestorCar = useMutation({
    mutationFn: async ({ investorId, carId, updates }) => {
      const result = await api.put(`/api/investors/${investorId}/cars/${carId}`, updates);
      if (result?.investor) {
        patchListCache(queryClient, queryKeys.investors(), (list) => upsertById(list, result.investor));
      }
      return result;
    },
  });
  const deleteInvestorCar = useMutation({
    mutationFn: async ({ investorId, carId }) => {
      const data = await api.delete(`/api/investors/${investorId}/cars/${carId}`);
      patchListCache(queryClient, queryKeys.investors(), (list) =>
        list.map((inv) =>
          inv.id === investorId
            ? { ...inv, cars: (inv.cars || []).filter((car) => car.id !== carId) }
            : inv,
        ),
      );
      return data;
    },
  });
  const sellInvestorCar = useMutation({
    mutationFn: async ({ investorId, carId, data }) => {
      const result = await api.post(`/api/investors/${investorId}/cars/${carId}/sell`, data);
      if (result?.investor) {
        patchListCache(queryClient, queryKeys.investors(), (list) => upsertById(list, result.investor));
      }
      return result;
    },
  });
  const deleteSoldItem = useMutation({
    mutationFn: async ({ investorId, saleId }) => {
      const result = await api.delete(`/api/investors/${investorId}/sold/${saleId}`);
      if (result?.investor) {
        patchListCache(queryClient, queryKeys.investors(), (list) => upsertById(list, result.investor));
      }
      return result;
    },
  });
  const resolveApproval = useMutation({
    mutationFn: ({ id, status, notes }) =>
      api.post(`/api/approvals/${id}/resolve`, { status, notes }),
    onSuccess: invalidateApprovals,
  });
  const markNotificationRead = useMutation({
    mutationFn: (id) => api.post(`/api/notifications/read/${id}`, {}),
    onSuccess: invalidateNotifications,
  });
  const clearNotifications = useMutation({
    mutationFn: () => api.post('/api/notifications/clear', {}),
    onSuccess: invalidateNotifications,
  });
  const createUser = useMutation({
    mutationFn: (payload) => api.post('/api/users', payload),
    onSuccess: invalidateUsers,
  });
  const updateUser = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/api/users/${id}`, payload),
    onSuccess: invalidateUsers,
  });
  const deleteUser = useMutation({
    mutationFn: (id) => api.delete(`/api/users/${id}`),
    onSuccess: invalidateUsers,
  });
  const addTechnician = useMutation({
    mutationFn: async (name) => {
      const data = await api.post('/api/technicians', { name });
      if (Array.isArray(data?.technicians)) {
        replaceListCache(queryClient, queryKeys.technicians(), data.technicians);
      }
      return data;
    },
  });
  const deleteTechnician = useMutation({
    mutationFn: async (name) => {
      const data = await api.delete(`/api/technicians/${encodeURIComponent(name)}`);
      if (Array.isArray(data?.technicians)) {
        replaceListCache(queryClient, queryKeys.technicians(), data.technicians);
      }
      return data;
    },
  });

  return {
    addProduct,
    editProduct,
    deleteProduct,
    addCustomer,
    editCustomer,
    deleteCustomer,
    addCustomerCar,
    createEstimate,
    updateEstimate,
    deleteEstimate,
    convertToJob,
    updateJobStatus,
    deleteJob,
    addExpense,
    deleteExpense,
    updateExpense,
    addInvestor,
    updateInvestor,
    deleteInvestor,
    addInvestorCar,
    updateInvestorCar,
    deleteInvestorCar,
    sellInvestorCar,
    deleteSoldItem,
    resolveApproval,
    markNotificationRead,
    clearNotifications,
    createUser,
    updateUser,
    deleteUser,
    addTechnician,
    deleteTechnician,
  };
}
