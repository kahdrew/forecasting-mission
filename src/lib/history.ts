import mongoose from 'mongoose';
import { ForecastHistory, ChangeType } from '@/models/ForecastHistory';
import { IForecastCategories } from '@/models/Forecast';
import { connectToDatabase } from './mongodb';

export interface CreateHistoryParams {
  forecastId: string;
  userId: string;
  userName: string;
  previousCategories: IForecastCategories | null;
  newCategories: IForecastCategories;
  changeType: ChangeType;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export async function createHistoryEntry(params: CreateHistoryParams): Promise<void> {
  await connectToDatabase();

  await ForecastHistory.create({
    forecastId: new mongoose.Types.ObjectId(params.forecastId),
    userId: new mongoose.Types.ObjectId(params.userId),
    userName: params.userName,
    previousCategories: params.previousCategories,
    newCategories: params.newCategories,
    changeType: params.changeType,
    reason: params.reason || null,
    metadata: params.metadata || {},
  });
}

export async function getForecastHistory(forecastId: string) {
  await connectToDatabase();

  return ForecastHistory.find({
    forecastId: new mongoose.Types.ObjectId(forecastId),
  })
    .sort({ createdAt: -1 })
    .lean();
}

export interface VarianceData {
  period: { type: string; year: number; value: number };
  previousTotal: number;
  currentTotal: number;
  change: number;
  changePercent: number;
  categoryChanges: {
    commit: { previous: number; current: number; change: number };
    consumption: { previous: number; current: number; change: number };
    bestCase: { previous: number; current: number; change: number };
    services: { previous: number; current: number; change: number };
  };
}

export function calculateVariance(
  previous: IForecastCategories,
  current: IForecastCategories
): VarianceData['categoryChanges'] {
  return {
    commit: {
      previous: previous.commit,
      current: current.commit,
      change: current.commit - previous.commit,
    },
    consumption: {
      previous: previous.consumption,
      current: current.consumption,
      change: current.consumption - previous.consumption,
    },
    bestCase: {
      previous: previous.bestCase,
      current: current.bestCase,
      change: current.bestCase - previous.bestCase,
    },
    services: {
      previous: previous.services,
      current: current.services,
      change: current.services - previous.services,
    },
  };
}

export function getTotalFromCategories(categories: IForecastCategories): number {
  return categories.commit + categories.consumption + categories.bestCase + categories.services;
}
