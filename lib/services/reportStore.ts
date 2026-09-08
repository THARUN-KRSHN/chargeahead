import { create } from 'zustand';
import type {
  StationReport,
  ReportCategory,
  ReportStatus,
  ChargingStation,
} from '@/types';
import { MOCK_REPORTS } from '@/lib/mock/reports';
import { useNotificationStore } from '@/lib/store/notificationStore';

const REPORT_DECAY_WINDOW_MIN = 180; // 3 hours

const CATEGORY_SEVERITY_WEIGHT: Record<ReportCategory, number> = {
  broken: -25,
  safety: -25,
  blocked: -15,
  payment_issue: -10,
  busy: -8,
  incorrect_info: -5,
  working: 5,
};

// Initial seeded station reports
const INITIAL_REPORTS: StationReport[] = MOCK_REPORTS.map((r, idx) => ({
  id: r.id,
  stationId: r.stationId,
  reporterId: r.userId,
  reporterName: r.userName,
  reporterAvatarUrl: r.userAvatarUrl,
  category: (r.type === 'offline' ? 'broken' : (r.type as ReportCategory)) || 'broken',
  comment: r.description,
  createdAt: r.createdAt,
  status: idx % 3 === 0 ? 'acknowledged' : 'new',
  corroborationCount: r.upvotes > 15 ? 3 : r.upvotes > 5 ? 1 : 0,
  verified: r.verified,
  portId: r.portId,
}));

interface ReportStoreState {
  reports: StationReport[];
  userLastReportTime: Record<string, number>; // key `${userId}_${stationId}` -> timestamp
  // Actions
  getReportsForStation: (stationId: string) => StationReport[];
  canUserReport: (userId: string, stationId: string) => { allowed: boolean; waitMinutes?: number };
  submitReport: (params: {
    stationId: string;
    stationName: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string;
    category: ReportCategory;
    comment?: string;
    photoUrl?: string;
    portId?: string;
  }) => StationReport;
  corroborateReport: (reportId: string, userId: string) => void;
  updateReportStatus: (reportId: string, status: ReportStatus, operatorNote?: string) => void;
  computeConfidenceScore: (station: ChargingStation) => number;
  getOperatorReports: (operatorId?: string) => StationReport[];
}

export const useReportStore = create<ReportStoreState>((set, get) => ({
  reports: INITIAL_REPORTS,
  userLastReportTime: {},

  getReportsForStation: (stationId: string) => {
    return get().reports.filter((r) => r.stationId === stationId);
  },

  canUserReport: (userId: string, stationId: string) => {
    const key = `${userId}_${stationId}`;
    const lastTime = get().userLastReportTime[key];
    if (!lastTime) return { allowed: true };

    const elapsedMin = (Date.now() - lastTime) / 60000;
    if (elapsedMin < 30) {
      return { allowed: false, waitMinutes: Math.ceil(30 - elapsedMin) };
    }
    return { allowed: true };
  },

  computeConfidenceScore: (station: ChargingStation) => {
    const stationReports = get().reports.filter(
      (r) => r.stationId === station.id && r.status !== 'resolved' && r.status !== 'expired',
    );

    const baseScore = station.confidenceBreakdown?.operatorData ?? station.confidenceScore ?? 80;
    if (stationReports.length === 0) return baseScore;

    let totalAdjustment = 0;
    const now = Date.now();

    for (const report of stationReports) {
      const ageMinutes = (now - new Date(report.createdAt).getTime()) / 60000;
      const decay = Math.max(0, 1 - ageMinutes / REPORT_DECAY_WINDOW_MIN);
      const severity = CATEGORY_SEVERITY_WEIGHT[report.category] ?? -5;
      const corroboration = 1 + Math.min(report.corroborationCount, 5) * 0.15;

      totalAdjustment += severity * decay * corroboration;
    }

    return Math.min(100, Math.max(0, Math.round(baseScore + totalAdjustment)));
  },

  submitReport: (params) => {
    const { stationId, stationName, userId, userName, userAvatarUrl, category, comment, photoUrl, portId } = params;
    const newReport: StationReport = {
      id: `rpt-${Date.now()}`,
      stationId,
      reporterId: userId,
      reporterName: userName,
      reporterAvatarUrl: userAvatarUrl,
      category,
      comment,
      photoUrl,
      portId,
      createdAt: new Date().toISOString(),
      status: 'new',
      corroborationCount: 0,
      verified: false,
    };

    set((state) => ({
      reports: [newReport, ...state.reports],
      userLastReportTime: {
        ...state.userLastReportTime,
        [`${userId}_${stationId}`]: Date.now(),
      },
    }));

    // Trigger same-route notification logic if threshold crossed
    const isHighSeverity = category === 'broken' || category === 'safety';
    if (isHighSeverity) {
      // High Urgency Notification to active driver
      useNotificationStore.getState().addNotification({
        id: `notif-${Date.now()}`,
        userId: 'user-001',
        type: 'reroute_alert',
        title: `⚠ Issue Reported at ${stationName}`,
        body: `A community member just reported: "${category.toUpperCase()} — ${comment || 'Station reported unavailable'}". Alternative route available!`,
        actionUrl: '/app/home',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: { stationId, category },
      });
    }

    return newReport;
  },

  corroborateReport: (reportId, userId) => {
    set((state) => {
      const updated = state.reports.map((r) => {
        if (r.id === reportId) {
          const newCount = r.corroborationCount + 1;

          // If corroboration reaches 2 or more, trigger notification
          if (newCount === 2) {
            useNotificationStore.getState().addNotification({
              id: `notif-${Date.now()}`,
              userId: 'user-001',
              type: 'community_report',
              title: `🔔 Multiple Drivers Confirmed Issue`,
              body: `2+ drivers confirmed ${r.category.toUpperCase()} at station. Trip routes updated automatically.`,
              actionUrl: '/app/notifications',
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }

          return { ...r, corroborationCount: newCount };
        }
        return r;
      });

      return { reports: updated };
    });
  },

  updateReportStatus: (reportId, status, operatorNote) => {
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status,
              operatorNote: operatorNote || r.operatorNote,
            }
          : r,
      ),
    }));
  },

  getOperatorReports: (operatorId) => {
    return get().reports;
  },
}));
