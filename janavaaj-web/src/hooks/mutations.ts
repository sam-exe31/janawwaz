import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  requestApi,
  notificationApi,
  ngoApi,
  adminApi,
  volunteerApi,
  userApi,
} from '../api/endpoints';
import type { CreateRequestPayload, Helper, NgoProfile } from '../api/types';

/* ----------------------------- Requests ----------------------------- */
export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => requestApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['myRequests'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useSubmitRating() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; stars: number; comment?: string }) =>
      requestApi.submitRating(v.id, v.stars, v.comment),
    onSuccess: (_data, v) => {
      void qc.invalidateQueries({ queryKey: ['requestRating', v.id] });
      void qc.invalidateQueries({ queryKey: ['request', v.id] });
      void qc.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
}

/* ------------------------------- User ------------------------------- */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; bio?: string; avatarUrl?: string }) =>
      userApi.updateMe(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

/* --------------------------- Notifications -------------------------- */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

/* ------------------------------- NGO -------------------------------- */
function useNgoAction<V>(fn: (v: V) => Promise<unknown>, requestIdOf?: (v: V) => number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_data, v) => {
      void qc.invalidateQueries({ queryKey: ['ngo'] });
      const rid = requestIdOf?.(v as V);
      if (rid != null) void qc.invalidateQueries({ queryKey: ['request', rid] });
    },
  });
}

export const useClaimRequest = () => useNgoAction((id: number) => ngoApi.claim(id), (id) => id);
export const useRejectRequest = () =>
  useNgoAction((v: { id: number; reason: string }) => ngoApi.reject(v.id, v.reason), (v) => v.id);
export const useAssignHelper = () =>
  useNgoAction((v: { claimId: number; helperId: number; note?: string }) =>
    ngoApi.assignHelper(v.claimId, v.helperId, v.note)
  );
export const useStartWork = () => useNgoAction((claimId: number) => ngoApi.startWork(claimId));
export const useCompleteWork = () => useNgoAction((claimId: number) => ngoApi.completeWork(claimId));
export const useAbandonClaim = () =>
  useNgoAction((v: { claimId: number; reason: string }) => ngoApi.abandonClaim(v.claimId, v.reason));
export const useAttachClaimPhoto = () =>
  useNgoAction((v: { claimId: number; kind: 'BEFORE' | 'AFTER'; uploadId: string }) =>
    ngoApi.attachPhoto(v.claimId, v.kind, v.uploadId)
  );

export function useUpdateNgoProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NgoProfile>) => ngoApi.updateMe(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ngo'] }),
  });
}

export function useCreateHelper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      phone: string;
      latitude: number;
      longitude: number;
      areaLabel?: string;
      photoUrl?: string;
    }) => ngoApi.createHelper(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ngo', 'helpers'] }),
  });
}

export function useUpdateHelper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; body: Partial<Helper> }) => ngoApi.updateHelper(v.id, v.body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ngo', 'helpers'] }),
  });
}

export function useDeleteHelper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ngoApi.deleteHelper(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ngo', 'helpers'] }),
  });
}

/* ------------------------------ Admin ------------------------------- */
function useAdminAction<V>(fn: (v: V) => Promise<unknown>, requestIdOf?: (v: V) => number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_data, v) => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      const rid = requestIdOf?.(v as V);
      if (rid != null) {
        void qc.invalidateQueries({ queryKey: ['request', rid] });
        void qc.invalidateQueries({ queryKey: ['requestHistory', rid] });
      }
    },
  });
}

export const useAdminApprove = () =>
  useAdminAction((v: { id: number; note: string }) => adminApi.approve(v.id, v.note), (v) => v.id);
export const useAdminMarkFake = () =>
  useAdminAction((v: { id: number; note: string }) => adminApi.markFake(v.id, v.note), (v) => v.id);
export const useAdminSetCategory = () =>
  useAdminAction(
    (v: { id: number; categoryId: number; note: string }) =>
      adminApi.setCategory(v.id, v.categoryId, v.note),
    (v) => v.id
  );
export const useAdminSetBudget = () =>
  useAdminAction(
    (v: { id: number; approvedBudget: number; note: string }) =>
      adminApi.setBudget(v.id, v.approvedBudget, v.note),
    (v) => v.id
  );
export const useAdminClose = () =>
  useAdminAction((v: { id: number; note: string }) => adminApi.close(v.id, v.note), (v) => v.id);
export const useAdminRelease = () =>
  useAdminAction((v: { id: number; note: string }) => adminApi.release(v.id, v.note), (v) => v.id);
export const useAdminTakeOver = () =>
  useAdminAction((v: { id: number; note: string }) => adminApi.takeOver(v.id, v.note), (v) => v.id);
export const useAdminRejectProof = () =>
  useAdminAction(
    (v: { id: number; note: string }) => adminApi.rejectProof(v.id, v.note),
    (v) => v.id
  );
export const useAdminOverrideStatus = () =>
  useAdminAction(
    (v: { id: number; status: string; note: string }) =>
      adminApi.overrideStatus(v.id, v.status, v.note),
    (v) => v.id
  );

export function useCreateNgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      registrationNumber: string;
      latitude: number;
      longitude: number;
      contactPhone?: string;
      description?: string;
      serviceRadiusKm?: number;
      areaLabel?: string;
    }) => adminApi.createNgo(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'ngos'] }),
  });
}

export const useDeleteNgo = () => useAdminAction((id: number) => adminApi.deleteNgo(id));
export const useVerifyCitizen = () => useAdminAction((id: number) => adminApi.verifyCitizen(id));
export const useSuspendCitizen = () => useAdminAction((id: number) => adminApi.suspendCitizen(id));
export const useReactivateCitizen = () =>
  useAdminAction((id: number) => adminApi.reactivateCitizen(id));
export const useGrantReward = () =>
  useAdminAction((body: { userId: number; points: number; reason: string; requestId?: number }) =>
    adminApi.grantReward(body)
  );

/* ---------------------------- Volunteer ----------------------------- */
export function useApplyVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: { note?: string }) => volunteerApi.applyVerification(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['volunteer'] }),
  });
}

export function useRecordVolunteerAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: number;
      outcome: string;
      note?: string;
      proofPhotoUrl?: string;
    }) => volunteerApi.recordAction(v.id, { outcome: v.outcome, note: v.note, proofPhotoUrl: v.proofPhotoUrl }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['volunteer'] }),
  });
}
